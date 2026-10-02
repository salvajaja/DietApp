import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
};

type Comida = {
  tipo: string;
  hora: string;
  nombre: string;
  descripcion: string;
  ingredientes: string[];
  preparacion: string;
};

type ContenidoPlan = {
  titulo: string;
  resumen: string;
  comidas: Comida[];
  recomendacion: string;
};

type Plan = {
  id: number;
  fecha: string;
  contenido: ContenidoPlan;
};

export default function InicioScreen() {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [usuarioId, setUsuarioId] =
    useState<string | null>(null);

  const [plan, setPlan] =
    useState<Plan | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [generando, setGenerando] =
    useState(false);

  const [refrescando, setRefrescando] =
    useState(false);

  // ==========================================
  // CARGAR USUARIO DESDE ASYNCSTORAGE
  // ==========================================

  const cargarUsuario = useCallback(async () => {
    try {
      const usuarioGuardado =
        await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        Alert.alert(
          "Sesión no encontrada",
          "Debes iniciar sesión nuevamente."
        );

        router.replace("/");
        return null;
      }

      const usuarioParseado: Usuario =
        JSON.parse(usuarioGuardado);

      if (!usuarioParseado?.id) {
        Alert.alert(
          "Error",
          "Los datos del usuario no son válidos."
        );

        router.replace("/");
        return null;
      }

      setUsuario(usuarioParseado);
      setUsuarioId(
        String(usuarioParseado.id)
      );

      return String(usuarioParseado.id);
    } catch (error) {
      console.error(
        "Error cargando usuario:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudieron cargar los datos del usuario."
      );

      router.replace("/");
      return null;
    }
  }, []);

  // ==========================================
  // CARGAR PLAN DE HOY
  // ==========================================

  const cargarPlan = useCallback(
    async (idUsuario?: string) => {
      const id =
        idUsuario || usuarioId;

      if (!id) {
        return;
      }

      try {
        const respuesta = await fetch(
          `https://dietapp-backend.onrender.com/api/plan-diario/${id}`
        );

        const datos =
          await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ||
              "No se pudo cargar el plan."
          );
        }

        if (
          datos.existe &&
          datos.plan
        ) {
          setPlan(datos.plan);
        } else {
          setPlan(null);
        }
      } catch (error) {
        console.error(
          "Error cargando plan:",
          error
        );

        Alert.alert(
          "Error",
          "No se pudo cargar el plan de hoy."
        );
      } finally {
        setCargando(false);
      }
    },
    [usuarioId]
  );

  // ==========================================
  // CARGAR TODO AL ABRIR
  // ==========================================

  useEffect(() => {
    const iniciarPantalla =
      async () => {
        const id =
          await cargarUsuario();

        if (id) {
          await cargarPlan(id);
        } else {
          setCargando(false);
        }
      };

    iniciarPantalla();
  }, [
    cargarUsuario,
    cargarPlan,
  ]);

  // ==========================================
  // GENERAR / ACTUALIZAR PLAN
  // ==========================================

  const generarPlan = async () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );

      return;
    }

    try {
      setGenerando(true);

      const respuesta = await fetch(
        "https://dietapp-backend.onrender.com/api/plan-diario/generar",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            usuarioId:
              String(usuarioId),
          }),
        }
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            "No se pudo generar el plan."
        );
      }

      if (!datos.plan) {
        throw new Error(
          "El servidor no devolvió un plan."
        );
      }

      setPlan(datos.plan);
    } catch (error) {
      console.error(
        "Error generando plan:",
        error
      );

      Alert.alert(
        "No se pudo generar el plan",
        "Comprueba que el backend y Groq estén funcionando."
      );
    } finally {
      setGenerando(false);
    }
  };

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
        await cargarPlan(id);
      }
    } finally {
      setRefrescando(false);
    }
  };

  // ==========================================
  // IR AL PERFIL
  // ==========================================

  const abrirPerfil = () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario actual."
      );

      return;
    }

    router.push({
      pathname: "/perfil",
      params: {
        usuarioId:
          String(usuarioId),
      },
    });
  };

  // ==========================================
  // ICONO SEGÚN LA COMIDA
  // ==========================================

  const obtenerIconoComida = (
    tipo: string
  ) => {
    const texto =
      tipo.toLowerCase();

    if (
      texto.includes("desay")
    ) {
      return "🍳";
    }

    if (
      texto.includes("almuer")
    ) {
      return "🍲";
    }

    if (
      texto.includes("cena")
    ) {
      return "🍽️";
    }

    if (
      texto.includes("snack") ||
      texto.includes("colación") ||
      texto.includes("media")
    ) {
      return "🍎";
    }

    return "🥗";
  };

  // ==========================================
  // FECHA
  // ==========================================

  const obtenerFecha = () => {
    return new Date().toLocaleDateString(
      "es-PE",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );
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
            Cargando tu plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // PANTALLA PRINCIPAL
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
              DietApp
            </Text>

            <Text
              style={styles.fecha}
            >
              {obtenerFecha()}
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

        <Text
          style={styles.saludo}
        >
          {usuario?.nombre
            ? `Hola, ${usuario.nombre} 👋`
            : "Tu plan de hoy 👋"}
        </Text>

        {/* ======================================
            SIN PLAN
        ====================================== */}

        {!plan ? (
          <View
            style={
              styles.cardGenerar
            }
          >
            <Text
              style={styles.iconoIA}
            >
              🤖
            </Text>

            <Text
              style={
                styles.tituloGenerar
              }
            >
              Tu plan personalizado
            </Text>

            <Text
              style={
                styles.textoGenerar
              }
            >
              DietApp analizará tu
              perfil, tus preferencias
              alimentarias, tus
              restricciones y tu rutina
              para generar tu plan del
              día.
            </Text>

            <TouchableOpacity
              style={
                styles.botonPrincipal
              }
              onPress={
                generarPlan
              }
              disabled={
                generando
              }
              activeOpacity={0.8}
            >
              {generando ? (
                <>
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />

                  <Text
                    style={[
                      styles.textoBotonPrincipal,
                      {
                        marginLeft: 8,
                      },
                    ]}
                  >
                    Generando...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.textoBotonPrincipal
                  }
                >
                  Generar mi plan
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ==================================
                TARJETA DEL PLAN
            ================================== */}

            <View
              style={
                styles.cardPlan
              }
            >
              <View
                style={
                  styles.filaPlan
                }
              >
                <Text
                  style={
                    styles.iconoPlan
                  }
                >
                  🤖
                </Text>

                <View
                  style={
                    styles.planTexto
                  }
                >
                  <Text
                    style={
                      styles.tituloPlan
                    }
                  >
                    {
                      plan
                        .contenido
                        .titulo
                    }
                  </Text>

                  <Text
                    style={
                      styles.resumenPlan
                    }
                  >
                    {
                      plan
                        .contenido
                        .resumen
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* ==================================
                COMIDAS
            ================================== */}

            <View
              style={
                styles.encabezadoSeccion
              }
            >
              <Text
                style={
                  styles.tituloSeccion
                }
              >
                Comidas de hoy
              </Text>

              <Text
                style={
                  styles.cantidadComidas
                }
              >
                {
                  plan.contenido
                    .comidas.length
                }{" "}
                comidas
              </Text>
            </View>

            {plan.contenido.comidas.map(
              (
                comida,
                index
              ) => (
                <View
                  key={`${comida.tipo}-${index}`}
                  style={
                    styles.cardComida
                  }
                >
                  <View
                    style={
                      styles.cabeceraComida
                    }
                  >
                    <View
                      style={
                        styles.iconoComidaContainer
                      }
                    >
                      <Text
                        style={
                          styles.iconoComida
                        }
                      >
                        {obtenerIconoComida(
                          comida.tipo
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.infoComida
                      }
                    >
                      <Text
                        style={
                          styles.tipoComida
                        }
                      >
                        {comida.tipo}
                      </Text>

                      <Text
                        style={
                          styles.horaComida
                        }
                      >
                        {comida.hora}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.nombreComida
                    }
                  >
                    {comida.nombre}
                  </Text>

                  <Text
                    style={
                      styles.descripcionComida
                    }
                  >
                    {
                      comida.descripcion
                    }
                  </Text>

                  <View
                    style={
                      styles.bloqueDetalle
                    }
                  >
                    <Text
                      style={
                        styles.tituloDetalle
                      }
                    >
                      Ingredientes
                    </Text>

                    <Text
                      style={
                        styles.textoDetalle
                      }
                    >
                      {comida.ingredientes.join(
                        " • "
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.bloqueDetalle
                    }
                  >
                    <Text
                      style={
                        styles.tituloDetalle
                      }
                    >
                      Preparación
                    </Text>

                    <Text
                      style={
                        styles.textoDetalle
                      }
                    >
                      {
                        comida.preparacion
                      }
                    </Text>
                  </View>
                </View>
              )
            )}

            {/* ==================================
                RECOMENDACIÓN
            ================================== */}

            <View
              style={
                styles.cardRecomendacion
              }
            >
              <Text
                style={
                  styles.tituloRecomendacion
                }
              >
                💡 Recomendación de
                DietApp
              </Text>

              <Text
                style={
                  styles.textoRecomendacion
                }
              >
                {
                  plan.contenido
                    .recomendacion
                }
              </Text>
            </View>

            {/* ==================================
                ACTUALIZAR PLAN
            ================================== */}

            <TouchableOpacity
              style={
                styles.botonActualizar
              }
              onPress={
                generarPlan
              }
              disabled={
                generando
              }
              activeOpacity={0.8}
            >
              {generando ? (
                <ActivityIndicator
                  color="#2196F3"
                />
              ) : (
                <Text
                  style={
                    styles.textoActualizar
                  }
                >
                  🔄 Actualizar plan
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ======================================
            ACCIONES
        ====================================== */}

        <Text
          style={
            styles.tituloSeccion
          }
        >
          Acciones rápidas
        </Text>

        <View
          style={styles.acciones}
        >
          <TouchableOpacity
            style={styles.accion}
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "Aquí podrás registrar tus comidas."
              )
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.accionIcono
              }
            >
              🍽️
            </Text>

            <Text
              style={
                styles.accionTexto
              }
            >
              Registrar comida
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accion}
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "Aquí podrás registrar tu actividad física."
              )
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.accionIcono
              }
            >
              🏃
            </Text>

            <Text
              style={
                styles.accionTexto
              }
            >
              Registrar actividad
            </Text>
          </TouchableOpacity>
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
              🏠
            </Text>

            <Text
              style={
                styles.navTextoActivo
              }
            >
              Inicio
            </Text>
          </View>

          {/* COMIDAS */}

          <TouchableOpacity
  style={styles.navItem}
  onPress={() =>
    router.push("/comidas")
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
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "Aquí estará tu actividad."
              )
            }
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

          <TouchableOpacity
            style={
              styles.navItem
            }
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "Aquí podrás ver tu progreso."
              )
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
                styles.navTexto
              }
            >
              Progreso
            </Text>
          </TouchableOpacity>

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
    marginBottom: 22,
  },

  logo: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2196F3",
  },

  fecha: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
    textTransform: "capitalize",
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

  saludo: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 18,
  },

  cardGenerar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    marginBottom: 25,
  },

  iconoIA: {
    fontSize: 44,
    marginBottom: 10,
  },

  tituloGenerar: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 10,
  },

  textoGenerar: {
    fontSize: 14,
    color: "#666",
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },

  botonPrincipal: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
  },

  textoBotonPrincipal: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  cardPlan: {
    backgroundColor: "#2196F3",
    borderRadius: 18,
    padding: 20,
    marginBottom: 25,
  },

  filaPlan: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconoPlan: {
    fontSize: 34,
    marginRight: 12,
  },

  planTexto: {
    flex: 1,
  },

  tituloPlan: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 7,
  },

  resumenPlan: {
    fontSize: 14,
    color: "#EAF5FF",
    lineHeight: 21,
  },

  encabezadoSeccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  tituloSeccion: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },

  cantidadComidas: {
    fontSize: 13,
    color: "#777",
  },

  cardComida: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D5E3EC",
  },

  cabeceraComida: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  iconoComidaContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#EAF5FF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  iconoComida: {
    fontSize: 25,
  },

  infoComida: {
    flex: 1,
  },

  tipoComida: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    textTransform: "capitalize",
  },

  horaComida: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },

  nombreComida: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 7,
  },

  descripcionComida: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 14,
  },

  bloqueDetalle: {
    backgroundColor: "#F7FAFC",
    borderRadius: 10,
    padding: 11,
    marginBottom: 9,
  },

  tituloDetalle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },

  textoDetalle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },

  cardRecomendacion: {
    backgroundColor: "#EAF5FF",
    borderRadius: 16,
    padding: 17,
    marginTop: 5,
    marginBottom: 18,
  },

  tituloRecomendacion: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 7,
  },

  textoRecomendacion: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },

  botonActualizar: {
    height: 50,
    borderWidth: 1.5,
    borderColor: "#2196F3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 27,
  },

  textoActualizar: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
  },

  acciones: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    marginBottom: 28,
  },

  accion: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 14,
    minHeight: 90,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  accionIcono: {
    fontSize: 26,
    marginBottom: 6,
  },

  accionTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
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
