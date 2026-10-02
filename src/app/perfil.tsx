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

// ==========================================
// TIPOS
// ==========================================

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
};

type DatosPersonales = {
  edad?: number;
  sexo?: string;
  peso?: number | string;
  altura?: number | string;
};

type ActividadObjetivo = {
  nivelActividad?: string;
  objetivo?: string;
};

type Alimentacion = {
  tipo?: string;
  alimentosRestringidos?: string[];
};

type SeguridadAlimentaria = {
  alergias?: string[];
  intolerancias?: string[];
};

type Preferencias = {
  alimentosGustan?: string[];
  alimentosNoGustan?: string[];
  comidasPorDia?: number;
  presupuesto?: string;
};

type Rutina = {
  desayuno?: string;
  almuerzo?: string;
  cena?: string;
  horariosRegulares?: boolean;
  tiempoCocina?: string;
};

type PerfilCompleto = {
  usuario: Usuario;
  datosPersonales: DatosPersonales;
  actividadObjetivo: ActividadObjetivo;
  alimentacion: Alimentacion;
  seguridadAlimentaria: SeguridadAlimentaria;
  preferencias: Preferencias;
  rutina: Rutina;
  equiposCocina: string[];
};

// ==========================================
// PANTALLA PERFIL
// ==========================================

export default function PerfilScreen() {
  const [datos, setDatos] = useState<PerfilCompleto | null>(null);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // ==========================================
  // CARGAR PERFIL COMPLETO
  // ==========================================

  const cargarPerfil = useCallback(async () => {
    try {
      const usuarioGuardado =
        await AsyncStorage.getItem("usuario");

      if (!usuarioGuardado) {
        router.replace("/");
        return;
      }

      const usuario: Usuario =
        JSON.parse(usuarioGuardado);

      if (!usuario?.id) {
        Alert.alert(
          "Error",
          "No se encontró el usuario actual."
        );

        router.replace("/");
        return;
      }

      console.log(
        "👤 Cargando perfil del usuario:",
        usuario.id
      );

      const respuesta = await fetch(
        `https://dietapp-backend.onrender.com/api/perfil-completo/${usuario.id}`
      );

      if (!respuesta.ok) {
        throw new Error(
          `Error HTTP ${respuesta.status}`
        );
      }

      const resultado: PerfilCompleto =
        await respuesta.json();

      console.log(
        "✅ Perfil recibido:",
        resultado
      );

      setDatos(resultado);
    } catch (error) {
      console.error(
        "❌ Error cargando perfil:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudo cargar la información de tu perfil."
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // ==========================================
  // CARGAR AL INICIAR
  // ==========================================

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // ==========================================
  // ACTUALIZAR
  // ==========================================

  const refrescar = async () => {
    setRefrescando(true);

    await cargarPerfil();
  };

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar la sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                "usuario"
              );

              router.replace("/");
            } catch (error) {
              console.error(
                "❌ Error cerrando sesión:",
                error
              );

              Alert.alert(
                "Error",
                "No se pudo cerrar la sesión."
              );
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // FUNCIONES AUXILIARES
  // ==========================================

  const mostrar = (
    valor: string | number | undefined | null
  ) => {
    if (
      valor === undefined ||
      valor === null ||
      valor === ""
    ) {
      return "-";
    }

    return String(valor);
  };

  const mostrarLista = (
    lista: string[] | undefined
  ) => {
    if (!lista || lista.length === 0) {
      return "Ninguno";
    }

    return lista.join(", ");
  };

  const mostrarHora = (
    hora: string | undefined
  ) => {
    if (!hora) {
      return "-";
    }

    // PostgreSQL puede devolver HH:MM:SS.
    // Mostramos solamente HH:MM.
    return hora.substring(0, 5);
  };

  const mostrarRegularidad = (
    regular: boolean | undefined
  ) => {
    if (regular === undefined) {
      return "-";
    }

    return regular ? "Sí" : "No";
  };

  // ==========================================
  // CARGANDO
  // ==========================================

  if (cargando) {
    return (
      <SafeAreaView
        style={styles.contenedorCarga}
      >
        <ActivityIndicator
          size="large"
          color="#2196F3"
        />

        <Text style={styles.textoCarga}>
          Cargando perfil...
        </Text>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SI NO HAY DATOS
  // ==========================================

  if (!datos) {
    return (
      <SafeAreaView
        style={styles.contenedorCarga}
      >
        <Text style={styles.errorTitulo}>
          No se pudo cargar el perfil
        </Text>

        <TouchableOpacity
          style={styles.botonReintentar}
          onPress={cargarPerfil}
        >
          <Text style={styles.textoReintentar}>
            Reintentar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonVolverError}
          onPress={() => router.back()}
        >
          <Text style={styles.textoVolverError}>
            Volver
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ==========================================
  // DATOS
  // ==========================================

  const usuario = datos.usuario;
  const perfil = datos.datosPersonales;
  const actividad = datos.actividadObjetivo;
  const alimentacion = datos.alimentacion;
  const seguridad =
    datos.seguridadAlimentaria;
  const preferencias = datos.preferencias;
  const rutina = datos.rutina;
  const equipos = datos.equiposCocina;

  // ==========================================
  // PANTALLA
  // ==========================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={["#2196F3"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================
            CABECERA
        ====================================== */}

        <View style={styles.cabecera}>
          <TouchableOpacity
            style={styles.botonVolver}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.iconoVolver}>
              ‹
            </Text>
          </TouchableOpacity>

          <View style={styles.tituloCabecera}>
            <Text style={styles.titulo}>
              Mi perfil
            </Text>

            <Text style={styles.subtitulo}>
              Tu información personal
            </Text>
          </View>
        </View>

        {/* ======================================
            TARJETA PRINCIPAL
        ====================================== */}

        <View style={styles.tarjetaUsuario}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {usuario.nombre
                ? usuario.nombre
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </Text>
          </View>

          <View style={styles.infoUsuario}>
            <Text style={styles.nombreUsuario}>
              {mostrar(usuario.nombre)}
            </Text>

            <Text style={styles.correoUsuario}>
              {mostrar(usuario.correo)}
            </Text>

            <View style={styles.estadoCuenta}>
              <View style={styles.puntoEstado} />

              <Text style={styles.textoEstado}>
                Cuenta activa
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================
            INFORMACIÓN PERSONAL
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            👤 Información personal
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="🎂"
              titulo="Edad"
              valor={
                perfil.edad
                  ? `${perfil.edad} años`
                  : "-"
              }
            />

            <Separador />

            <FilaDato
              icono="⚥"
              titulo="Sexo"
              valor={mostrar(perfil.sexo)}
            />

            <Separador />

            <FilaDato
              icono="⚖️"
              titulo="Peso"
              valor={
                perfil.peso
                  ? `${perfil.peso} kg`
                  : "-"
              }
            />

            <Separador />

            <FilaDato
              icono="📏"
              titulo="Altura"
              valor={
                perfil.altura
                  ? `${perfil.altura} cm`
                  : "-"
              }
            />
          </View>
        </View>

        {/* ======================================
            OBJETIVO Y ACTIVIDAD
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            🎯 Objetivo y actividad
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="🎯"
              titulo="Objetivo"
              valor={mostrar(
                actividad.objetivo
              )}
            />

            <Separador />

            <FilaDato
              icono="🏃"
              titulo="Nivel de actividad"
              valor={mostrar(
                actividad.nivelActividad
              )}
            />
          </View>
        </View>

        {/* ======================================
            ALIMENTACIÓN
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            🍽️ Alimentación
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="🥗"
              titulo="Tipo de alimentación"
              valor={mostrar(
                alimentacion.tipo
              )}
              vertical
            />

            <Separador />

            <FilaDato
              icono="🚫"
              titulo="Alimentos restringidos"
              valor={mostrarLista(
                alimentacion.alimentosRestringidos
              )}
              vertical
            />
          </View>
        </View>

        {/* ======================================
            ALERGIAS E INTOLERANCIAS
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            ⚠️ Alergias e intolerancias
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="⚠️"
              titulo="Alergias"
              valor={mostrarLista(
                seguridad.alergias
              )}
              vertical
            />

            <Separador />

            <FilaDato
              icono="🚫"
              titulo="Intolerancias"
              valor={mostrarLista(
                seguridad.intolerancias
              )}
              vertical
            />
          </View>
        </View>

        {/* ======================================
            PREFERENCIAS
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            ❤️ Preferencias alimentarias
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="❤️"
              titulo="Alimentos que te gustan"
              valor={mostrarLista(
                preferencias.alimentosGustan
              )}
              vertical
            />

            <Separador />

            <FilaDato
              icono="❌"
              titulo="Alimentos que no deseas consumir"
              valor={mostrarLista(
                preferencias.alimentosNoGustan
              )}
              vertical
            />

            <Separador />

            <FilaDato
              icono="🍴"
              titulo="Comidas por día"
              valor={
                preferencias.comidasPorDia
                  ? `${preferencias.comidasPorDia} comidas`
                  : "-"
              }
            />

            <Separador />

            <FilaDato
              icono="💰"
              titulo="Presupuesto"
              valor={mostrar(
                preferencias.presupuesto
              )}
            />
          </View>
        </View>

        {/* ======================================
            RUTINA
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            🕐 Rutina
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="🌅"
              titulo="Desayuno"
              valor={mostrarHora(
                rutina.desayuno
              )}
            />

            <Separador />

            <FilaDato
              icono="☀️"
              titulo="Almuerzo"
              valor={mostrarHora(
                rutina.almuerzo
              )}
            />

            <Separador />

            <FilaDato
              icono="🌙"
              titulo="Cena"
              valor={mostrarHora(
                rutina.cena
              )}
            />

            <Separador />

            <FilaDato
              icono="📅"
              titulo="Horarios regulares"
              valor={mostrarRegularidad(
                rutina.horariosRegulares
              )}
            />

            <Separador />

            <FilaDato
              icono="⏱️"
              titulo="Tiempo para cocinar"
              valor={mostrar(
                rutina.tiempoCocina
              )}
            />
          </View>
        </View>

        {/* ======================================
            EQUIPOS DE COCINA
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            🍳 Equipos de cocina
          </Text>

          <View style={styles.tarjeta}>
            <FilaDato
              icono="🔪"
              titulo="Equipamiento disponible"
              valor={mostrarLista(equipos)}
              vertical
            />
          </View>
        </View>

        {/* ======================================
            ACCIONES
        ====================================== */}

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>
            ⚙️ Cuenta
          </Text>

          <View style={styles.tarjetaAcciones}>
            <TouchableOpacity
              style={styles.botonAccion}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  "Editar perfil",
                  "Esta opción estará disponible próximamente."
                )
              }
            >
              <View style={styles.iconoAccion}>
                <Text>✏️</Text>
              </View>

              <View style={styles.textoAccion}>
                <Text style={styles.tituloAccion}>
                  Editar perfil
                </Text>

                <Text
                  style={styles.descripcionAccion}
                >
                  Modifica tus datos y preferencias
                </Text>
              </View>

              <Text style={styles.flecha}>
                ›
              </Text>
            </TouchableOpacity>

            <View style={styles.separadorAccion} />

            <TouchableOpacity
              style={styles.botonAccion}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  "Generar nuevo plan",
                  "Esta opción estará disponible desde Inicio."
                )
              }
            >
              <View style={styles.iconoAccion}>
                <Text>✨</Text>
              </View>

              <View style={styles.textoAccion}>
                <Text style={styles.tituloAccion}>
                  Nuevo plan alimentario
                </Text>

                <Text
                  style={styles.descripcionAccion}
                >
                  Genera un plan personalizado
                </Text>
              </View>

              <Text style={styles.flecha}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================
            CERRAR SESIÓN
        ====================================== */}

        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={cerrarSesion}
          activeOpacity={0.8}
        >
          <Text style={styles.iconoCerrarSesion}>
            🚪
          </Text>

          <Text style={styles.textoCerrarSesion}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          DietApp · Tu alimentación, personalizada
        </Text>

        <View style={styles.espacioFinal} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// COMPONENTE FILA
// ==========================================

function FilaDato({
  icono,
  titulo,
  valor,
  vertical = false,
}: {
  icono: string;
  titulo: string;
  valor: string;
  vertical?: boolean;
}) {
  return (
    <View
      style={[
        styles.filaDato,
        vertical && styles.filaVertical,
      ]}
    >
      <View style={styles.iconoDato}>
        <Text style={styles.iconoDatoTexto}>
          {icono}
        </Text>
      </View>

      <View style={styles.contenidoDato}>
        <Text style={styles.tituloDato}>
          {titulo}
        </Text>

        <Text
          style={[
            styles.valorDato,
            vertical && styles.valorVertical,
          ]}
        >
          {valor}
        </Text>
      </View>
    </View>
  );
}

// ==========================================
// SEPARADOR
// ==========================================

function Separador() {
  return <View style={styles.separador} />;
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },

  scroll: {
    flex: 1,
  },

  contenido: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  contenedorCarga: {
    flex: 1,
    backgroundColor: "#F4F8FC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  textoCarga: {
    marginTop: 12,
    fontSize: 15,
    color: "#607D8B",
  },

  errorTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
    textAlign: "center",
    marginBottom: 18,
  },

  botonReintentar: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
  },

  textoReintentar: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  botonVolverError: {
    marginTop: 12,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },

  textoVolverError: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
  },

  // ========================================
  // CABECERA
  // ========================================

  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  iconoVolver: {
    fontSize: 32,
    color: "#1976D2",
    lineHeight: 34,
    marginTop: -3,
  },

  tituloCabecera: {
    flex: 1,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "800",
    color: "#16324F",
  },

  subtitulo: {
    fontSize: 14,
    color: "#78909C",
    marginTop: 3,
  },

  // ========================================
  // USUARIO
  // ========================================

  tarjetaUsuario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  avatarTexto: {
    fontSize: 29,
    fontWeight: "800",
    color: "#1976D2",
  },

  infoUsuario: {
    flex: 1,
  },

  nombreUsuario: {
    fontSize: 21,
    fontWeight: "800",
    color: "#16324F",
  },

  correoUsuario: {
    fontSize: 14,
    color: "#78909C",
    marginTop: 4,
  },

  estadoCuenta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  puntoEstado: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 7,
  },

  textoEstado: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },

  // ========================================
  // SECCIONES
  // ========================================

  seccion: {
    marginBottom: 22,
  },

  tituloSeccion: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16324F",
    marginBottom: 11,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  filaDato: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },

  filaVertical: {
    alignItems: "flex-start",
    paddingVertical: 13,
  },

  iconoDato: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F8FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  iconoDatoTexto: {
    fontSize: 19,
  },

  contenidoDato: {
    flex: 1,
  },

  tituloDato: {
    fontSize: 12,
    color: "#90A4AE",
    fontWeight: "600",
    marginBottom: 3,
  },

  valorDato: {
    fontSize: 15,
    color: "#263238",
    fontWeight: "600",
  },

  valorVertical: {
    lineHeight: 21,
  },

  separador: {
    height: 1,
    backgroundColor: "#EEF3F7",
  },

  // ========================================
  // ACCIONES
  // ========================================

  tarjetaAcciones: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  botonAccion: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
  },

  iconoAccion: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F1F8FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  textoAccion: {
    flex: 1,
  },

  tituloAccion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#263238",
  },

  descripcionAccion: {
    fontSize: 12,
    color: "#90A4AE",
    marginTop: 3,
  },

  flecha: {
    fontSize: 27,
    color: "#90A4AE",
    marginLeft: 8,
  },

  separadorAccion: {
    height: 1,
    backgroundColor: "#EEF3F7",
  },

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  botonCerrarSesion: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD6D6",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  iconoCerrarSesion: {
    fontSize: 18,
    marginRight: 9,
  },

  textoCerrarSesion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#D32F2F",
  },

  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#A0ADB5",
    marginTop: 18,
  },

  espacioFinal: {
    height: 30,
  },
});


