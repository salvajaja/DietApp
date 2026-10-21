import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API_URL = "https://dietapp-backend.onrender.com";

type Actividad = {
  id: number;
  tipo_actividad: string;
  duracion_minutos: number;
  fecha: string;
  hora: string;
  calorias_quemadas?: number | null;
};

export default function ActividadScreen() {
  const params = useLocalSearchParams();

  const [usuarioId, setUsuarioId] = useState<string | null>(
    params.usuarioId ? String(params.usuarioId) : null
  );

  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const [tipoActividad, setTipoActividad] = useState("");
  const [duracion, setDuracion] = useState("");

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (usuarioId) {
      cargarActividades();
    }
  }, [usuarioId]);

  const obtenerUsuario = async () => {
    try {
      if (usuarioId) {
        console.log(
          "Usuario recibido por navegación:",
          usuarioId
        );
        return;
      }

      const usuarioGuardado =
        await AsyncStorage.getItem("usuario");

      console.log(
        "Usuario guardado:",
        usuarioGuardado
      );

      if (!usuarioGuardado) {
        Alert.alert(
          "Sesión no encontrada",
          "Debes iniciar sesión nuevamente."
        );

        router.replace("/");
        return;
      }

      const usuario =
        JSON.parse(usuarioGuardado);

      console.log(
        "Usuario obtenido de AsyncStorage:",
        usuario
      );

      if (!usuario.id) {
        Alert.alert(
          "Error",
          "No se encontró el ID del usuario."
        );
        return;
      }

      setUsuarioId(String(usuario.id));
    } catch (error) {
      console.log(
        "Error obteniendo usuario:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudo obtener la información de tu sesión."
      );
    }
  };

  // =====================================================
  // CARGAR ACTIVIDADES
  // =====================================================

  const cargarActividades = async () => {
    if (!usuarioId) {
      console.log(
        "No existe usuarioId todavía."
      );
      return;
    }

    try {
      setCargando(true);

      console.log(
        "--------------------------------------"
      );

      console.log(
        "CARGANDO ACTIVIDADES"
      );

      console.log(
        "Usuario ID:",
        usuarioId
      );

      console.log(
        "URL:",
        `${API_URL}/api/actividades/${usuarioId}`
      );

      console.log(
        "--------------------------------------"
      );

      const response = await fetch(
        `${API_URL}/api/actividades/${usuarioId}`
      );

      console.log(
        "Estado respuesta actividades:",
        response.status
      );

      const data = await response.json();

      console.log(
        "RESPUESTA ACTIVIDADES:"
      );

      console.log(
        JSON.stringify(data, null, 2)
      );

      if (
        response.ok &&
        data &&
        Array.isArray(data.actividades)
      ) {
        setActividades(data.actividades);

        console.log(
          "Actividades encontradas:",
          data.actividades.length
        );
      } else {
        setActividades([]);
      }
    } catch (error) {
      console.log(
        "ERROR CARGANDO ACTIVIDADES:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudieron cargar las actividades. Verifica que el backend esté funcionando."
      );
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // ACTUALIZAR
  // =====================================================

  const actualizar = () => {
    setRefreshing(true);
    cargarActividades();
  };

  // =====================================================
  // REGISTRAR ACTIVIDAD
  // =====================================================

  const registrarActividad = async () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );
      return;
    }

    if (!tipoActividad.trim()) {
      Alert.alert(
        "Actividad",
        "Escribe qué actividad realizaste."
      );
      return;
    }

    const minutos = Number(duracion);

    if (!duracion.trim()) {
      Alert.alert(
        "Duración",
        "Ingresa la duración de la actividad."
      );
      return;
    }

    if (
      !Number.isInteger(minutos) ||
      minutos <= 0
    ) {
      Alert.alert(
        "Duración inválida",
        "La duración debe ser un número entero mayor a 0."
      );
      return;
    }

    try {
      setRegistrando(true);

      console.log(
        "Registrando actividad:",
        {
          usuarioId,
          tipoActividad,
          duracion: minutos,
        }
      );

      const response = await fetch(
        `${API_URL}/api/actividades/registrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: Number(usuarioId),
            tipoActividad:
              tipoActividad.trim(),
            duracionMinutos: minutos,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Respuesta registro actividad:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "No se pudo registrar",
          data.mensaje ||
            "No se pudo registrar la actividad."
        );

        return;
      }

      Alert.alert(
        "¡Actividad registrada!",
        `${tipoActividad.trim()} durante ${minutos} minutos se registró correctamente.`,
        [
          {
            text: "OK",
            onPress: async () => {
              setTipoActividad("");
              setDuracion("");

              await cargarActividades();
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "ERROR REGISTRANDO ACTIVIDAD:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudo registrar la actividad. Verifica que el backend esté funcionando."
      );
    } finally {
      setRegistrando(false);
    }
  };

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  const irAInicio = () => {
    router.push({
      pathname: "/inicio",
      params: {
        usuarioId: usuarioId || "",
      },
    });
  };

  const irAComidas = () => {
    router.push({
      pathname: "/comidas",
      params: {
        usuarioId: usuarioId || "",
      },
    });
  };

  const irAProgreso = () => {
    router.push({
      pathname: "/progreso",
      params: {
        usuarioId: usuarioId || "",
      },
    });
  };

  const irAPerfil = () => {
    router.push({
      pathname: "/perfil",
      params: {
        usuarioId: usuarioId || "",
      },
    });
  };

  // =====================================================
  // TARJETA DE ACTIVIDAD
  // =====================================================

  const renderActividad = (
    actividad: Actividad,
    index: number
  ) => {
    let icono = "🏃";

    const tipo =
      actividad.tipo_actividad
        ? actividad.tipo_actividad.toLowerCase()
        : "";

    if (
      tipo.includes("caminar") ||
      tipo.includes("caminata")
    ) {
      icono = "🚶";
    } else if (
      tipo.includes("correr") ||
      tipo.includes("trotar")
    ) {
      icono = "🏃";
    } else if (
      tipo.includes("bicicleta") ||
      tipo.includes("ciclismo")
    ) {
      icono = "🚴";
    } else if (
      tipo.includes("nadar") ||
      tipo.includes("natación")
    ) {
      icono = "🏊";
    } else if (
      tipo.includes("gimnasio") ||
      tipo.includes("pesas")
    ) {
      icono = "🏋️";
    } else if (
      tipo.includes("fútbol") ||
      tipo.includes("futbol")
    ) {
      icono = "⚽";
    } else if (
      tipo.includes("básquet") ||
      tipo.includes("basket")
    ) {
      icono = "🏀";
    }

    return (
      <View
        style={styles.actividadCard}
        key={`${actividad.id}-${index}`}
      >
        <View
          style={styles.actividadHeader}
        >
          <View style={styles.iconoActividad}>
            <Text
              style={styles.iconoTexto}
            >
              {icono}
            </Text>
          </View>

          <View
            style={styles.actividadTituloContainer}
          >
            <Text
              style={styles.actividadNombre}
            >
              {actividad.tipo_actividad}
            </Text>

            <Text
              style={styles.actividadHora}
            >
              🕐 {actividad.hora}
            </Text>
          </View>

          <View
            style={styles.registradaBadge}
          >
            <Text
              style={styles.registradaTexto}
            >
              ✓
            </Text>
          </View>
        </View>

        <View
          style={styles.detalleActividad}
        >
          <View
            style={styles.detalleItem}
          >
            <Text
              style={styles.detalleIcono}
            >
              ⏱️
            </Text>

            <View>
              <Text
                style={styles.detalleEtiqueta}
              >
                Duración
              </Text>

              <Text
                style={styles.detalleValor}
              >
                {actividad.duracion_minutos} minutos
              </Text>
            </View>
          </View>

          {actividad.calorias_quemadas !==
            null &&
            actividad.calorias_quemadas !==
              undefined && (
              <View
                style={styles.detalleItem}
              >
                <Text
                  style={styles.detalleIcono}
                >
                  🔥
                </Text>

                <View>
                  <Text
                    style={
                      styles.detalleEtiqueta
                    }
                  >
                    Calorías
                  </Text>

                  <Text
                    style={
                      styles.detalleValor
                    }
                  >
                    {
                      actividad.calorias_quemadas
                    }{" "}
                    kcal
                  </Text>
                </View>
              </View>
            )}
        </View>

        <View
          style={styles.estadoRegistrado}
        >
          <Text
            style={
              styles.estadoRegistradoTexto
            }
          >
            ✓ Actividad registrada
          </Text>
        </View>
      </View>
    );
  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.cargandoContainer}
        >
          <ActivityIndicator
            size="large"
            color="#2196F3"
          />

          <Text
            style={styles.cargandoTexto}
          >
            Cargando tus actividades...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PANTALLA
  // =====================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={actualizar}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text
            style={styles.headerTitulo}
          >
            🏃 Mi actividad
          </Text>

          <Text
            style={styles.headerSubtitulo}
          >
            Registra las actividades físicas
            que realizas durante el día
          </Text>
        </View>

        {/* RESUMEN */}

        <View
          style={styles.resumenCard}
        >
          <View>
            <Text
              style={styles.resumenTitulo}
            >
              Actividades registradas
            </Text>

            <Text
              style={styles.resumenNumero}
            >
              {actividades.length}
            </Text>
          </View>

          <View
            style={styles.resumenIcono}
          >
            <Text
              style={
                styles.resumenIconoTexto
              }
            >
              🏃
            </Text>
          </View>
        </View>

        {/* REGISTRAR ACTIVIDAD */}

        <Text
          style={styles.seccionTitulo}
        >
          Registrar actividad
        </Text>

        <View
          style={styles.registroCard}
        >
          <Text
            style={styles.label}
          >
            ¿Qué actividad realizaste?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Caminar"
            placeholderTextColor="#9CA3AF"
            value={tipoActividad}
            onChangeText={
              setTipoActividad
            }
          />

          <Text
            style={styles.label}
          >
            Duración en minutos
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. 30"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={duracion}
            onChangeText={setDuracion}
          />

          <TouchableOpacity
            style={[
              styles.botonRegistrar,
              registrando &&
                styles.botonDeshabilitado,
            ]}
            onPress={
              registrarActividad
            }
            disabled={registrando}
          >
            {registrando ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={[
                    styles.botonRegistrarTexto,
                    {
                      marginLeft: 8,
                    },
                  ]}
                >
                  Registrando...
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.botonRegistrarTexto
                }
              >
                🏃 Registrar actividad
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* HISTORIAL */}

        <Text
          style={styles.seccionTitulo}
        >
          Actividades de hoy
        </Text>

        {actividades.length === 0 ? (
          <View
            style={styles.vacioCard}
          >
            <Text
              style={styles.vacioIcono}
            >
              🏃
            </Text>

            <Text
              style={styles.vacioTitulo}
            >
              No tienes actividades
              registradas
            </Text>

            <Text
              style={styles.vacioTexto}
            >
              Registra una actividad física
              utilizando el formulario de
              arriba.
            </Text>
          </View>
        ) : (
          actividades.map(
            renderActividad
          )
        )}

        {/* INFORMACIÓN */}

        <View
          style={styles.infoCard}
        >
          <Text
            style={styles.infoTitulo}
          >
            💡 ¿Por qué registrar tu
            actividad?
          </Text>

          <Text
            style={styles.infoTexto}
          >
            Registrar tus actividades físicas
            permitirá a DietApp llevar un
            seguimiento de tu actividad diaria
            y posteriormente calcular las
            calorías que has quemado.
          </Text>
        </View>
      </ScrollView>

      {/* NAVEGACIÓN INFERIOR */}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={irAInicio}
        >
          <Text
            style={styles.navIcono}
          >
            🏠
          </Text>

          <Text
            style={styles.navTexto}
          >
            Inicio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAComidas}
        >
          <Text
            style={styles.navIcono}
          >
            🍽️
          </Text>

          <Text
            style={styles.navTexto}
          >
            Comidas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItemActivo}
        >
          <Text
            style={styles.navIcono}
          >
            🏃
          </Text>

          <Text
            style={styles.navTextoActivo}
          >
            Actividad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAProgreso}
        >
          <Text
            style={styles.navIcono}
          >
            📊
          </Text>

          <Text
            style={styles.navTexto}
          >
            Progreso
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAPerfil}
        >
          <Text
            style={styles.navIcono}
          >
            👤
          </Text>

          <Text
            style={styles.navTexto}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FC",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  header: {
    marginBottom: 20,
  },

  headerTitulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
  },

  headerSubtitulo: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
  },

  resumenCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  resumenTitulo: {
    fontSize: 14,
    color: "#6B7280",
  },

  resumenNumero: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2196F3",
    marginTop: 3,
  },

  resumenIcono: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },

  resumenIconoTexto: {
    fontSize: 28,
  },

  seccionTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 15,
  },

  registroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
    elevation: 2,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },

  botonRegistrar: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  botonDeshabilitado: {
    backgroundColor: "#90CAF9",
  },

  botonRegistrarTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  actividadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },

  actividadHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  iconoActividad: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  iconoTexto: {
    fontSize: 25,
  },

  actividadTituloContainer: {
    flex: 1,
  },

  actividadNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  actividadHora: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  registradaBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },

  registradaTexto: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "800",
  },

  detalleActividad: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  detalleItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  detalleIcono: {
    fontSize: 22,
    marginRight: 8,
  },

  detalleEtiqueta: {
    fontSize: 12,
    color: "#6B7280",
  },

  detalleValor: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 2,
  },

  estadoRegistrado: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },

  estadoRegistradoTexto: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "700",
  },

  vacioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 2,
    marginBottom: 16,
  },

  vacioIcono: {
    fontSize: 45,
    marginBottom: 15,
  },

  vacioTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },

  vacioTexto: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },

  infoCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    padding: 18,
    marginTop: 5,
  },

  infoTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1565C0",
    marginBottom: 5,
  },

  infoTexto: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
  },

  cargandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cargandoTexto: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  navItemActivo: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  navIcono: {
    fontSize: 21,
  },

  navTexto: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 3,
  },

  navTextoActivo: {
    fontSize: 11,
    color: "#2196F3",
    fontWeight: "700",
    marginTop: 3,
  },
});

