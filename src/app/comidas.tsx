
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "https://dietapp-backend.onrender.com";

type ComidaPlan = {
  tipo: string;
  hora: string;
  nombre: string;
  descripcion: string;
  ingredientes?: string[];
  preparacion?: string;
};

type RegistroComida = {
  id: number;
  tipo_comida: string;
  nombre: string;
  hora: string;
  fecha: string;
  foto_url?: string;
  verificacion_estado?: string;
  verificacion_mensaje?: string;
  confianza?: number | null;
};

export default function ComidasScreen() {
  const params = useLocalSearchParams();

  const [usuarioId, setUsuarioId] = useState<string | null>(
    params.usuarioId ? String(params.usuarioId) : null
  );

  const [comidasPlan, setComidasPlan] = useState<ComidaPlan[]>([]);
  const [registradas, setRegistradas] = useState<RegistroComida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registrandoTipo, setRegistrandoTipo] = useState<string | null>(null);
  const [verificandoTipo, setVerificandoTipo] = useState<string | null>(null);

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (usuarioId) {
      cargarDatos();
    }
  }, [usuarioId]);

  const obtenerUsuario = async () => {
    try {
      if (usuarioId) {
        console.log("Usuario recibido por navegación:", usuarioId);
        return;
      }

      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        Alert.alert(
          "Sesión no encontrada",
          "Debes iniciar sesión nuevamente."
        );

        router.replace("/");
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);

      if (!usuario.id) {
        Alert.alert("Error", "No se encontró el ID del usuario.");
        return;
      }

      setUsuarioId(String(usuario.id));
    } catch (error) {
      console.log("Error obteniendo usuario:", error);

      Alert.alert(
        "Error",
        "No se pudo obtener la información de tu sesión."
      );
    }
  };

  // =====================================================
  // CARGAR PLAN Y COMIDAS REGISTRADAS
  // =====================================================

  const cargarDatos = async (mostrarCarga = true) => {
    if (!usuarioId) {
      console.log("No existe usuarioId todavía.");
      return;
    }

    try {
      if (mostrarCarga) {
        setCargando(true);
      }

      const [planResponse, comidasResponse] = await Promise.all([
        fetch(`${API_URL}/api/plan-diario/${usuarioId}`),
        fetch(`${API_URL}/api/comidas/${usuarioId}`),
      ]);

      const planData = await planResponse.json();
      const comidasData = await comidasResponse.json();

      console.log("RESPUESTA DEL PLAN:", planData);
      console.log("RESPUESTA DE COMIDAS:", comidasData);

      // Procesar plan
      if (
        planData.existe === true &&
        planData.plan?.contenido &&
        Array.isArray(planData.plan.contenido.comidas)
      ) {
        setComidasPlan(planData.plan.contenido.comidas);
      } else {
        setComidasPlan([]);
      }

      // Procesar registros
      if (Array.isArray(comidasData?.comidas)) {
        setRegistradas(comidasData.comidas);
      } else {
        setRegistradas([]);
      }
    } catch (error) {
      console.log("ERROR CARGANDO DATOS DE COMIDAS:", error);

      Alert.alert(
        "Error",
        "No se pudieron cargar las comidas. Verifica que el backend esté funcionando."
      );
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }

      setRefreshing(false);
    }
  };

  // =====================================================
  // ACTUALIZAR
  // =====================================================

  const actualizar = () => {
    setRefreshing(true);
    cargarDatos(false);
  };

  // =====================================================
  // OBTENER EL REGISTRO DE UNA COMIDA
  // =====================================================

  const obtenerRegistroComida = (
    comida: ComidaPlan
  ): RegistroComida | undefined => {
    return [...registradas]
      .reverse()
      .find(
        (registro) =>
          registro.tipo_comida?.toLowerCase() ===
            comida.tipo.toLowerCase() &&
          registro.nombre?.toLowerCase() ===
            comida.nombre.toLowerCase()
      );
  };

  // =====================================================
  // COMPROBAR SI LA COMIDA ESTÁ VERIFICADA
  // =====================================================

  const comidaEstaRegistrada = (
    comida: ComidaPlan
  ) => {
    const registro = obtenerRegistroComida(comida);

    return (
      registro?.verificacion_estado?.toLowerCase() ===
      "verificada"
    );
  };

  // =====================================================
  // TOMAR FOTO Y REGISTRAR COMIDA
  // =====================================================

  const registrarComida = async (comida: ComidaPlan) => {
    if (!usuarioId) {
      Alert.alert("Error", "No se encontró el usuario.");
      return;
    }

    if (registrandoTipo || verificandoTipo) {
      return;
    }

    if (comidaEstaRegistrada(comida)) {
      Alert.alert(
        "Comida verificada",
        "Esta comida ya fue registrada y verificada hoy."
      );
      return;
    }

    try {
      setRegistrandoTipo(comida.tipo);

      // Solicitar permiso de cámara
      const permiso =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso de cámara",
          "Necesitamos acceso a la cámara para tomar una foto de tu comida."
        );
        return;
      }

      // Abrir cámara
      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      // Usuario canceló
      if (resultado.canceled) {
        return;
      }

      // Validar foto
      const asset = resultado.assets?.[0];

      if (!asset) {
        Alert.alert(
          "Foto no encontrada",
          "No se pudo obtener la fotografía. Intenta nuevamente."
        );
        return;
      }

      if (!asset.base64) {
        Alert.alert(
          "Error con la fotografía",
          "No se pudo preparar la imagen para enviarla. Intenta nuevamente."
        );
        return;
      }

      const fotoBase64 = `data:image/jpeg;base64,${asset.base64}`;

      // Confirmar fotografía
      Alert.alert(
        "Confirmar fotografía",
        `¿Deseas registrar esta foto como tu ${comida.tipo.toLowerCase()}?`,
        [
          {
            text: "Tomar otra",
            style: "cancel",
            onPress: () => {
              setRegistrandoTipo(null);
            },
          },
          {
            text: "Registrar",
            onPress: () => {
              void enviarRegistro(comida, fotoBase64);
            },
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (error) {
      console.log("ERROR TOMANDO FOTO:", error);

      Alert.alert(
        "Error",
        "No se pudo abrir la cámara o tomar la fotografía."
      );

      setRegistrandoTipo(null);
    }
  };

  // =====================================================
  // ENVIAR FOTO Y VERIFICAR INMEDIATAMENTE CON IA
  // =====================================================

  const enviarRegistro = async (
    comida: ComidaPlan,
    foto: string
  ) => {
    if (!usuarioId) {
      setRegistrandoTipo(null);
      Alert.alert("Error", "No se encontró el usuario.");
      return;
    }

    try {
      setVerificandoTipo(comida.tipo);

      console.log("Enviando fotografía al backend para verificar...");

      const response = await fetch(
        `${API_URL}/api/comidas/registrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: Number(usuarioId),
            tipoComida: comida.tipo,
            foto,
          }),
        }
      );

      const data = await response.json();

      console.log("Respuesta del backend:", data);

      // El backend debe devolver un error si no pudo verificar la foto.
      if (!response.ok) {
        Alert.alert(
          response.status === 502
            ? "No se pudo verificar la foto"
            : "No se pudo registrar",
          data.mensaje || "Ocurrió un error al registrar la comida."
        );

        return;
      }

      // Leer la respuesta del backend.
      const estado = String(
        data.verificacion?.estado ??
          data.comida?.verificacion_estado ??
          "pendiente"
      ).toLowerCase();

      const mensaje =
        data.verificacion?.mensaje ??
        data.comida?.verificacion_mensaje ??
        data.mensaje ??
        "No se recibió el detalle de la verificación.";

      const confianza =
        data.verificacion?.confianza ??
        data.comida?.confianza;

      // Actualizar las tarjetas sin mostrar la pantalla de carga completa.
      await cargarDatos(false);

      const titulo =
        estado === "verificada"
          ? "¡Comida verificada!"
          : estado === "rechazada"
            ? "Comida rechazada"
            : "Verificación pendiente";

      const detalleConfianza =
        typeof confianza === "number"
          ? `\n\nConfianza estimada por la IA: ${confianza}%`
          : "";

      Alert.alert(
        titulo,
        `${mensaje}${detalleConfianza}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.log("ERROR ENVIANDO O VERIFICANDO FOTO:", error);

      Alert.alert(
        "Error de conexión",
        "No se pudo obtener la verificación. Comprueba tu conexión e inténtalo nuevamente."
      );
    } finally {
      setVerificandoTipo(null);
      setRegistrandoTipo(null);
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

  const irAActividad = () => {
    router.push({
      pathname: "/actividad",
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
  // TARJETA DE COMIDA
  // =====================================================

  const renderComida = (
    comida: ComidaPlan,
    index: number
  ) => {
    const registro = obtenerRegistroComida(comida);
    const registrada = comidaEstaRegistrada(comida);

    const registrando =
      registrandoTipo === comida.tipo;

    const verificando =
      verificandoTipo === comida.tipo;

    const estadoRegistro =
      registro?.verificacion_estado?.toLowerCase();

    const tipo = comida.tipo
      ? comida.tipo.toLowerCase()
      : "";

    let icono = "🍎";

    if (tipo.includes("desay")) {
      icono = "☀️";
    } else if (tipo.includes("almuerzo")) {
      icono = "🍛";
    } else if (tipo.includes("cena")) {
      icono = "🌙";
    } else if (
      tipo.includes("snack") ||
      tipo.includes("merienda")
    ) {
      icono = "🍎";
    }

    return (
      <View
        style={styles.comidaCard}
        key={`${comida.tipo}-${comida.nombre}-${index}`}
      >
        {/* ENCABEZADO */}

        <View style={styles.comidaHeader}>
          <View style={styles.iconoComida}>
            <Text style={styles.iconoTexto}>{icono}</Text>
          </View>

          <View style={styles.comidaTituloContainer}>
            <Text style={styles.comidaTipo}>
              {comida.tipo}
            </Text>

            <Text style={styles.comidaHora}>
              🕐 {comida.hora}
            </Text>
          </View>

          {registrada && (
            <View style={styles.registradaBadge}>
              <Text style={styles.registradaTexto}>✓</Text>
            </View>
          )}
        </View>

        {/* NOMBRE */}

        <Text style={styles.comidaNombre}>
          {comida.nombre}
        </Text>

        {/* DESCRIPCIÓN */}

        {comida.descripcion ? (
          <Text style={styles.descripcion}>
            {comida.descripcion}
          </Text>
        ) : null}

        {/* INGREDIENTES */}

        {comida.ingredientes &&
          comida.ingredientes.length > 0 && (
            <View style={styles.ingredientesContainer}>
              <Text style={styles.subtitulo}>
                Ingredientes
              </Text>

              {comida.ingredientes.map((ingrediente, i) => (
                <Text key={i} style={styles.ingrediente}>
                  • {ingrediente}
                </Text>
              ))}
            </View>
          )}

        {/* RESULTADO DE VERIFICACIÓN */}

        {registrada ? (
          <View style={styles.estadoRegistrado}>
            <Text style={styles.estadoRegistradoTexto}>
              ✓ Comida verificada
            </Text>

            {registro?.verificacion_mensaje ? (
              <Text style={styles.detalleVerificacion}>
                {registro.verificacion_mensaje}
              </Text>
            ) : null}

            {typeof registro?.confianza === "number" ? (
              <Text style={styles.detalleVerificacion}>
                Confianza estimada: {registro.confianza}%
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            {estadoRegistro === "rechazada" && (
              <View style={styles.estadoRechazado}>
                <Text style={styles.estadoRechazadoTexto}>
                  ✕ Foto rechazada
                </Text>

                <Text style={styles.detalleVerificacion}>
                  {registro?.verificacion_mensaje ||
                    "La imagen no coincide con el plan. Puedes intentarlo de nuevo."}
                </Text>

                {typeof registro?.confianza === "number" && (
                  <Text style={styles.detalleVerificacion}>
                    Confianza estimada: {registro.confianza}%
                  </Text>
                )}
              </View>
            )}

            {estadoRegistro === "pendiente" && (
              <View style={styles.estadoPendiente}>
                <Text style={styles.estadoPendienteTexto}>
                  Verificación pendiente
                </Text>

                <Text style={styles.detalleVerificacion}>
                  {registro?.verificacion_mensaje ||
                    "La fotografía todavía no ha sido verificada."}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.botonRegistrar,
                (registrando || verificando) &&
                  styles.botonDeshabilitado,
              ]}
              onPress={() => registrarComida(comida)}
              disabled={
                registrando ||
                verificando ||
                registrandoTipo !== null ||
                verificandoTipo !== null
              }
            >
              {registrando || verificando ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text
                    style={[
                      styles.botonRegistrarTexto,
                      { marginLeft: 8 },
                    ]}
                  >
                    {verificando
                      ? "Verificando foto con IA..."
                      : "Abriendo cámara..."}
                  </Text>
                </>
              ) : (
                <Text style={styles.botonRegistrarTexto}>
                  {estadoRegistro === "rechazada"
                    ? "📷 Tomar otra foto"
                    : "📷 Registrar comida"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // =====================================================
  // PANTALLA DE CARGA INICIAL
  // =====================================================

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <ActivityIndicator
            size="large"
            color="#2196F3"
          />

          <Text style={styles.cargandoTexto}>
            Cargando tus comidas...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PANTALLA PRINCIPAL
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={actualizar}
          />
        }
      >
        {/* ENCABEZADO */}

        <View style={styles.header}>
          <Text style={styles.headerTitulo}>
            🍽️ Mis comidas
          </Text>

          <Text style={styles.headerSubtitulo}>
            Registra cada comida tomando una fotografía
          </Text>
        </View>

        {/* RESUMEN */}

        <View style={styles.resumenCard}>
          <View>
            <Text style={styles.resumenTitulo}>
              Comidas verificadas
            </Text>

            <Text style={styles.resumenNumero}>
              {registradas.filter(
                (registro) =>
                  registro.verificacion_estado?.toLowerCase() ===
                  "verificada"
              ).length}
            </Text>
          </View>

          <View style={styles.resumenIcono}>
            <Text style={styles.resumenIconoTexto}>
              ✓
            </Text>
          </View>
        </View>

        {/* PLAN DE COMIDAS */}

        {comidasPlan.length === 0 ? (
          <View style={styles.vacioCard}>
            <Text style={styles.vacioIcono}>🍽️</Text>

            <Text style={styles.vacioTitulo}>
              No tienes un plan para hoy
            </Text>

            <Text style={styles.vacioTexto}>
              Genera tu plan diario desde Inicio para poder
              registrar tus comidas.
            </Text>

            <TouchableOpacity
              style={styles.botonInicio}
              onPress={irAInicio}
            >
              <Text style={styles.botonInicioTexto}>
                Ir a Inicio
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.seccionTitulo}>
              Plan de comidas de hoy
            </Text>

            {comidasPlan.map(renderComida)}
          </>
        )}

        {/* INFORMACIÓN */}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitulo}>
            📷 ¿Cómo registrar una comida?
          </Text>

          <Text style={styles.infoTexto}>
            Pulsa "Registrar comida", toma una fotografía
            del plato y confirma el registro. La IA analizará
            la imagen y comprobará si coincide con tu plan.
            Si la foto es rechazada, podrás intentarlo de nuevo.
          </Text>
        </View>
      </ScrollView>

      {/* NAVEGACIÓN INFERIOR */}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={irAInicio}
        >
          <Text style={styles.navIcono}>🏠</Text>
          <Text style={styles.navTexto}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActivo}>
          <Text style={styles.navIcono}>🍽️</Text>
          <Text style={styles.navTextoActivo}>Comidas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAActividad}
        >
          <Text style={styles.navIcono}>🏃</Text>
          <Text style={styles.navTexto}>Actividad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAProgreso}
        >
          <Text style={styles.navIcono}>📊</Text>
          <Text style={styles.navTexto}>Progreso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={irAPerfil}
        >
          <Text style={styles.navIcono}>👤</Text>
          <Text style={styles.navTexto}>Perfil</Text>
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
    color: "#2196F3",
  },

  seccionTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 15,
  },

  comidaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },

  comidaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  iconoComida: {
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

  comidaTituloContainer: {
    flex: 1,
  },

  comidaTipo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  comidaHora: {
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

  comidaNombre: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 7,
  },

  descripcion: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },

  ingredientesContainer: {
    marginBottom: 15,
  },

  subtitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 5,
  },

  ingrediente: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  botonRegistrar: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 10,
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
    textAlign: "center",
  },

  estadoRegistrado: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },

  estadoRegistradoTexto: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "700",
  },

  estadoRechazado: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },

  estadoRechazadoTexto: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  estadoPendiente: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },

  estadoPendienteTexto: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },

  detalleVerificacion: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  vacioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 2,
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

  botonInicio: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },

  botonInicioTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
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
