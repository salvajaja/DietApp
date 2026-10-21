import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

const API_URL =
  "https://dietapp-backend.onrender.com";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
};

type DatosPersonales = {
  edad?: number;
  sexo?: string;
  peso?: number;
  altura?: number;
};

type ActividadObjetivo = {
  actividad?: string;
  objetivo?: string;
};

type Preferencias = {
  comidasPorDia?: number;
  presupuesto?: string;
};

type PerfilCompleto = {
  usuario?: Usuario;
  datosPersonales?: DatosPersonales | null;
  actividadObjetivo?: ActividadObjetivo | null;
  alimentacion?: any;
  seguridadAlimentaria?: any;
  preferencias?: Preferencias | null;
  rutina?: any;
  equiposCocina?: any;
};

type ComidaRegistrada = {
  id?: number;
  tipo_comida?: string;
  tipoComida?: string;
  verificacion_estado?: string;
  verificacion_mensaje?: string;
  fecha?: string;
};

export default function ProgresoScreen() {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [usuarioId, setUsuarioId] =
    useState<string | null>(null);

  const [perfil, setPerfil] =
    useState<PerfilCompleto | null>(null);

  const [comidas, setComidas] =
    useState<ComidaRegistrada[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [refrescando, setRefrescando] =
    useState(false);

  // ==========================================
  // CARGAR USUARIO
  // ==========================================

  const cargarUsuario = useCallback(
    async () => {
      try {
        const usuarioGuardado =
          await AsyncStorage.getItem(
            "usuario"
          );

        if (!usuarioGuardado) {
          Alert.alert(
            "Sesión no encontrada",
            "Debes iniciar sesión nuevamente."
          );

          router.replace("/");
          return null;
        }

        const usuario: Usuario =
          JSON.parse(usuarioGuardado);

        if (!usuario?.id) {
          Alert.alert(
            "Error",
            "Los datos del usuario no son válidos."
          );

          router.replace("/");
          return null;
        }

        const id = String(usuario.id);

        setUsuarioId(id);

        return id;
      } catch (error) {
        console.error(
          "Error cargando usuario:",
          error
        );

        Alert.alert(
          "Error",
          "No se pudo cargar la sesión."
        );

        router.replace("/");
        return null;
      }
    },
    []
  );

  // ==========================================
  // CARGAR PERFIL COMPLETO
  // ==========================================

  const cargarPerfil = useCallback(
    async (id: string) => {
      try {
        const respuesta = await fetch(
          `${API_URL}/api/perfil-completo/${id}`
        );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ||
              "No se pudo cargar el perfil."
          );
        }

        setPerfil(datos);
      } catch (error) {
        console.error(
          "Error cargando perfil:",
          error
        );

        Alert.alert(
          "Error",
          "No se pudo cargar la información del progreso."
        );
      }
    },
    []
  );

  // ==========================================
  // CARGAR COMIDAS REGISTRADAS
  // ==========================================

  const cargarComidas = useCallback(
    async (id: string) => {
      try {
        const respuesta = await fetch(
          `${API_URL}/api/comidas/${id}`
        );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ||
              "No se pudieron cargar las comidas."
          );
        }

        if (Array.isArray(datos.comidas)) {
          setComidas(datos.comidas);
        } else if (Array.isArray(datos)) {
          setComidas(datos);
        } else {
          setComidas([]);
        }
      } catch (error) {
        console.error(
          "Error cargando comidas:",
          error
        );

        setComidas([]);
      }
    },
    []
  );

  // ==========================================
  // CARGAR TODO
  // ==========================================

  const cargarDatos = useCallback(
    async () => {
      try {
        const id =
          usuarioId ||
          (await cargarUsuario());

        if (!id) {
          return;
        }

        await Promise.all([
          cargarPerfil(id),
          cargarComidas(id),
        ]);
      } catch (error) {
        console.error(
          "Error cargando progreso:",
          error
        );
      } finally {
        setCargando(false);
      }
    },
    [
      usuarioId,
      cargarUsuario,
      cargarPerfil,
      cargarComidas,
    ]
  );

  // ==========================================
  // RECARGAR AL ENTRAR A LA PANTALLA
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  // ==========================================
  // REFRESCAR
  // ==========================================

  const refrescar = async () => {
    setRefrescando(true);

    try {
      const id =
        usuarioId ||
        (await cargarUsuario());

      if (id) {
        await Promise.all([
          cargarPerfil(id),
          cargarComidas(id),
        ]);
      }
    } finally {
      setRefrescando(false);
    }
  };

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  const abrirInicio = () => {
    router.push("/inicio");
  };

  const abrirComidas = () => {
    if (!usuarioId) {
      return;
    }

    router.push({
      pathname: "/comidas",
      params: {
        usuarioId,
      },
    });
  };

  const abrirActividad = () => {
    if (!usuarioId) {
      return;
    }

    router.push({
      pathname: "/actividad",
      params: {
        usuarioId,
      },
    });
  };

  const abrirPerfil = () => {
    if (!usuarioId) {
      return;
    }

    router.push({
      pathname: "/perfil",
      params: {
        usuarioId,
      },
    });
  };

  // ==========================================
  // DATOS PARA MOSTRAR
  // ==========================================

  const nombreUsuario =
    perfil?.usuario?.nombre ||
    "Usuario";

  const peso =
    perfil?.datosPersonales?.peso;

  const altura =
    perfil?.datosPersonales?.altura;

  const edad =
    perfil?.datosPersonales?.edad;

  const objetivo =
    perfil?.actividadObjetivo?.objetivo ||
    "No definido";

  const actividad =
    perfil?.actividadObjetivo?.actividad ||
    "No definida";

  const comidasRegistradas =
    comidas.length;

  const comidasVerificadas =
    comidas.filter(
      (comida) =>
        comida.verificacion_estado ===
        "verificado"
    ).length;

  const porcentajeComidas =
    comidasRegistradas > 0
      ? Math.round(
          (comidasVerificadas /
            comidasRegistradas) *
            100
        )
      : 0;

  // ==========================================
  // MENSAJE DE PROGRESO
  // ==========================================

  const obtenerMensajeProgreso = () => {
    if (comidasRegistradas === 0) {
      return "Empieza registrando tus comidas para que DietApp pueda mostrar tu progreso.";
    }

    if (porcentajeComidas >= 80) {
      return "¡Muy bien! Estás manteniendo una buena constancia con tus registros.";
    }

    if (porcentajeComidas >= 50) {
      return "Vas avanzando. Sigue registrando tus comidas para conocer mejor tu progreso.";
    }

    return "Continúa registrando tus comidas. Cada registro ayuda a conocer mejor tu avance.";
  };

  // ==========================================
  // PANTALLA DE CARGA
  // ==========================================

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.cargando}
        >
          <ActivityIndicator
            size="large"
            color="#2196F3"
          />

          <Text
            style={
              styles.textoCargando
            }
          >
            Cargando tu progreso...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // PANTALLA
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refrescando
            }
            onRefresh={
              refrescar
            }
          />
        }
      >
        {/* ======================================
            ENCABEZADO
        ====================================== */}

        <View
          style={styles.encabezado}
        >
          <View>
            <Text
              style={styles.logo}
            >
              Progreso
            </Text>

            <Text
              style={styles.subtitulo}
            >
              Tu avance en DietApp
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.botonPerfil
            }
            onPress={
              abrirPerfil
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.iconoPerfil
              }
            >
              👤
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================
            SALUDO
        ====================================== */}

        <View
          style={styles.saludoCard}
        >
          <Text
            style={
              styles.saludoTitulo
            }
          >
            Hola, {nombreUsuario} 👋
          </Text>

          <Text
            style={
              styles.saludoTexto
            }
          >
            Aquí puedes consultar
            algunos datos importantes
            de tu avance.
          </Text>
        </View>

        {/* ======================================
            OBJETIVO
        ====================================== */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Mi objetivo
        </Text>

        <View
          style={
            styles.cardObjetivo
          }
        >
          <View
            style={
              styles.iconoObjetivo
            }
          >
            <Text
              style={
                styles.iconoGrande
              }
            >
              🎯
            </Text>
          </View>

          <View
            style={
              styles.infoObjetivo
            }
          >
            <Text
              style={
                styles.etiqueta
              }
            >
              Objetivo actual
            </Text>

            <Text
              style={
                styles.valorObjetivo
              }
            >
              {objetivo}
            </Text>

            <Text
              style={
                styles.actividadTexto
              }
            >
              Nivel de actividad:{" "}
              {actividad}
            </Text>
          </View>
        </View>

        {/* ======================================
            DATOS PERSONALES
        ====================================== */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Mis datos
        </Text>

        <View
          style={styles.datosGrid}
        >
          {/* PESO */}

          <View
            style={styles.cardDato}
          >
            <Text
              style={
                styles.iconoDato
              }
            >
              ⚖️
            </Text>

            <Text
              style={
                styles.etiquetaDato
              }
            >
              Peso
            </Text>

            <Text
              style={
                styles.valorDato
              }
            >
              {peso
                ? `${peso} kg`
                : "--"}
            </Text>
          </View>

          {/* ALTURA */}

          <View
            style={styles.cardDato}
          >
            <Text
              style={
                styles.iconoDato
              }
            >
              📏
            </Text>

            <Text
              style={
                styles.etiquetaDato
              }
            >
              Altura
            </Text>

            <Text
              style={
                styles.valorDato
              }
            >
              {altura
                ? `${altura} cm`
                : "--"}
            </Text>
          </View>

          {/* EDAD */}

          <View
            style={styles.cardDato}
          >
            <Text
              style={
                styles.iconoDato
              }
            >
              🎂
            </Text>

            <Text
              style={
                styles.etiquetaDato
              }
            >
              Edad
            </Text>

            <Text
              style={
                styles.valorDato
              }
            >
              {edad
                ? `${edad} años`
                : "--"}
            </Text>
          </View>
        </View>

        {/* ======================================
            COMIDAS
        ====================================== */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Registro de comidas
        </Text>

        <View
          style={
            styles.cardComidas
          }
        >
          <View
            style={
              styles.filaComidas
            }
          >
            <View
              style={
                styles.iconoComidas
              }
            >
              <Text
                style={
                  styles.iconoGrande
                }
              >
                🍽️
              </Text>
            </View>

            <View
              style={
                styles.infoComidas
              }
            >
              <Text
                style={
                  styles.tituloCard
                }
              >
                Comidas registradas
              </Text>

              <Text
                style={
                  styles.numeroComidas
                }
              >
                {comidasRegistradas}
              </Text>

              <Text
                style={
                  styles.textoCard
                }
              >
                registros encontrados
              </Text>
            </View>
          </View>

          {/* BARRA */}

          <View
            style={
              styles.barraFondo
            }
          >
            <View
              style={[
                styles.barraProgreso,
                {
                  width: `${porcentajeComidas}%`,
                },
              ]}
            />
          </View>

          <Text
            style={
              styles.textoPorcentaje
            }
          >
            {porcentajeComidas}% de
            registros verificados
          </Text>

          <TouchableOpacity
            style={
              styles.botonSecundario
            }
            onPress={
              abrirComidas
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.textoBotonSecundario
              }
            >
              Ver mis comidas
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================
            ACTIVIDAD
        ====================================== */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Actividad física
        </Text>

        <View
          style={
            styles.cardActividad
          }
        >
          <View
            style={
              styles.filaActividad
            }
          >
            <View
              style={
                styles.iconoActividad
              }
            >
              <Text
                style={
                  styles.iconoGrande
                }
              >
                🏃
              </Text>
            </View>

            <View
              style={
                styles.infoActividad
              }
            >
              <Text
                style={
                  styles.tituloCard
                }
              >
                Mantén tu actividad
              </Text>

              <Text
                style={
                  styles.textoCard
                }
              >
                Tu nivel actual es:
              </Text>

              <Text
                style={
                  styles.valorActividad
                }
              >
                {actividad}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.botonActividad
            }
            onPress={
              abrirActividad
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.textoBotonActividad
              }
            >
              Registrar actividad
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================
            MENSAJE
        ====================================== */}

        <View
          style={
            styles.cardMensaje
          }
        >
          <Text
            style={
              styles.iconoMensaje
            }
          >
            💡
          </Text>

          <View
            style={
              styles.contenidoMensaje
            }
          >
            <Text
              style={
                styles.tituloMensaje
              }
            >
              Tu progreso
            </Text>

            <Text
              style={
                styles.textoMensaje
              }
            >
              {obtenerMensajeProgreso()}
            </Text>
          </View>
        </View>

        {/* ======================================
            NAVEGACIÓN
        ====================================== */}

        <View
          style={
            styles.navegacion
          }
        >
          {/* INICIO */}

          <TouchableOpacity
            style={
              styles.navItem
            }
            onPress={
              abrirInicio
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.navIcono
              }
            >
              🏠
            </Text>

            <Text
              style={
                styles.navTexto
              }
            >
              Inicio
            </Text>
          </TouchableOpacity>

          {/* COMIDAS */}

          <TouchableOpacity
            style={
              styles.navItem
            }
            onPress={
              abrirComidas
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.navIcono
              }
            >
              🍽️
            </Text>

            <Text
              style={
                styles.navTexto
              }
            >
              Comidas
            </Text>
          </TouchableOpacity>

          {/* ACTIVIDAD */}

          <TouchableOpacity
            style={
              styles.navItem
            }
            onPress={
              abrirActividad
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.navIcono
              }
            >
              🏃
            </Text>

            <Text
              style={
                styles.navTexto
              }
            >
              Actividad
            </Text>
          </TouchableOpacity>

          {/* PROGRESO */}

          <View
            style={
              styles.navItemActivo
            }
          >
            <Text
              style={
                styles.navIcono
              }
            >
              📊
            </Text>

            <Text
              style={
                styles.navTextoActivo
              }
            >
              Progreso
            </Text>
          </View>

          {/* PERFIL */}

          <TouchableOpacity
            style={
              styles.navItem
            }
            onPress={
              abrirPerfil
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.navIcono
              }
            >
              👤
            </Text>

            <Text
              style={
                styles.navTexto
              }
            >
              Perfil
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// ESTILOS
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAFF",
  },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 35,
  },

  cargando: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  textoCargando: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },

  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2196F3",
  },

  subtitulo: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  botonPerfil: {
    width: 46,
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  iconoPerfil: {
    fontSize: 21,
  },

  saludoCard: {
    backgroundColor: "#2196F3",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },

  saludoTitulo: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 7,
  },

  saludoTexto: {
    fontSize: 14,
    color: "#EAF5FF",
    lineHeight: 21,
  },

  tituloSeccion: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 14,
  },

  cardObjetivo: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  iconoObjetivo: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  iconoGrande: {
    fontSize: 27,
  },

  infoObjetivo: {
    flex: 1,
  },

  etiqueta: {
    fontSize: 12,
    color: "#888",
    marginBottom: 3,
  },

  valorObjetivo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },

  actividadTexto: {
    fontSize: 13,
    color: "#666",
  },

  datosGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  cardDato: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
  },

  iconoDato: {
    fontSize: 23,
    marginBottom: 6,
  },

  etiquetaDato: {
    fontSize: 12,
    color: "#888",
    marginBottom: 3,
  },

  valorDato: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },

  cardComidas: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
  },

  filaComidas: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  iconoComidas: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  infoComidas: {
    flex: 1,
  },

  tituloCard: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },

  numeroComidas: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#2196F3",
  },

  textoCard: {
    fontSize: 13,
    color: "#777",
  },

  barraFondo: {
    height: 9,
    backgroundColor: "#E4EDF4",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 7,
  },

  barraProgreso: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 5,
  },

  textoPorcentaje: {
    fontSize: 12,
    color: "#777",
    marginBottom: 14,
  },

  botonSecundario: {
    height: 45,
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  textoBotonSecundario: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "bold",
  },

  cardActividad: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
  },

  filaActividad: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  iconoActividad: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#EAF5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  infoActividad: {
    flex: 1,
  },

  valorActividad: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2196F3",
    marginTop: 3,
  },

  botonActividad: {
    height: 46,
    backgroundColor: "#2196F3",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  textoBotonActividad: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  cardMensaje: {
    backgroundColor: "#EAF5FF",
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    marginBottom: 28,
  },

  iconoMensaje: {
    fontSize: 27,
    marginRight: 12,
  },

  contenidoMensaje: {
    flex: 1,
  },

  tituloMensaje: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 5,
  },

  textoMensaje: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },

  navegacion: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 4,
    justifyContent: "space-around",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },

  navItemActivo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },

  navIcono: {
    fontSize: 20,
    marginBottom: 3,
  },

  navTexto: {
    fontSize: 10,
    color: "#777",
  },

  navTextoActivo: {
    fontSize: 10,
    color: "#2196F3",
    fontWeight: "bold",
  },
});