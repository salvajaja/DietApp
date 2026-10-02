import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type CampoHora = "desayuno" | "almuerzo" | "cena";

export default function RutinaScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [desayuno, setDesayuno] = useState<Date | null>(null);
  const [almuerzo, setAlmuerzo] = useState<Date | null>(null);
  const [cena, setCena] = useState<Date | null>(null);

  const [campoActivo, setCampoActivo] =
    useState<CampoHora | null>(null);

  const [horariosRegulares, setHorariosRegulares] =
    useState<boolean | null>(null);

  const [tiempoCocina, setTiempoCocina] =
    useState("");

  const [cargando, setCargando] = useState(false);

  const tiempos = [
    "Menos de 15 minutos",
    "15 - 30 minutos",
    "30 - 60 minutos",
    "Más de 1 hora",
  ];

  // ==========================================
  // ABRIR SELECTOR DE HORA
  // ==========================================

  const abrirSelectorHora = (campo: CampoHora) => {
    setCampoActivo(campo);
  };

  // ==========================================
  // GUARDAR HORA SELECCIONADA
  // ==========================================

  const cambiarHora = (
    event: DateTimePickerEvent,
    fechaSeleccionada?: Date
  ) => {
    if (event.type === "dismissed") {
      setCampoActivo(null);
      return;
    }

    if (!fechaSeleccionada || !campoActivo) {
      setCampoActivo(null);
      return;
    }

    if (campoActivo === "desayuno") {
      setDesayuno(fechaSeleccionada);
    }

    if (campoActivo === "almuerzo") {
      setAlmuerzo(fechaSeleccionada);
    }

    if (campoActivo === "cena") {
      setCena(fechaSeleccionada);
    }

    setCampoActivo(null);
  };

  // ==========================================
  // FORMATO PARA MOSTRAR EN PANTALLA
  // ==========================================

  const mostrarHora = (hora: Date | null) => {
    if (!hora) {
      return "Seleccionar hora";
    }

    return hora.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // FORMATO PARA POSTGRESQL
  // ==========================================

  const formatoHoraBD = (hora: Date) => {
    const horas = String(hora.getHours()).padStart(2, "0");
    const minutos = String(hora.getMinutes()).padStart(2, "0");

    return `${horas}:${minutos}`;
  };

  // ==========================================
  // GUARDAR DATOS
  // ==========================================

  const guardarDatos = async () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );
      return;
    }

    if (!desayuno || !almuerzo || !cena) {
      Alert.alert(
        "Campos incompletos",
        "Selecciona los horarios de desayuno, almuerzo y cena."
      );
      return;
    }

    if (horariosRegulares === null) {
      Alert.alert(
        "Campo incompleto",
        "Indica si tus horarios son regulares."
      );
      return;
    }

    if (!tiempoCocina) {
      Alert.alert(
        "Campo incompleto",
        "Selecciona cuánto tiempo tienes para cocinar."
      );
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        "http://10.0.2.2:3000/api/rutina",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            desayuno: formatoHoraBD(desayuno),
            almuerzo: formatoHoraBD(almuerzo),
            cena: formatoHoraBD(cena),
            horariosRegulares,
            tiempoCocina,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje ||
            "No se pudo guardar la rutina."
        );
        return;
      }

      Alert.alert(
        "Rutina guardada",
        "Tu rutina se guardó correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/equipos",
                params: {
                  usuarioId: String(usuarioId),
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Error al guardar rutina:",
        error
      );

      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // OBTENER FECHA DEL CAMPO ACTIVO
  // ==========================================

  const obtenerHoraActiva = () => {
    if (campoActivo === "desayuno" && desayuno) {
      return desayuno;
    }

    if (campoActivo === "almuerzo" && almuerzo) {
      return almuerzo;
    }

    if (campoActivo === "cena" && cena) {
      return cena;
    }

    return new Date();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* VOLVER */}
        <TouchableOpacity
          style={styles.volver}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVolver}>
            ← Volver
          </Text>
        </TouchableOpacity>

        {/* PROGRESO */}
        <Text style={styles.paso}>
          Paso 7 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Tu rutina
        </Text>

        <Text style={styles.subtitulo}>
          Queremos conocer tus horarios habituales
          para adaptar mejor tus recomendaciones.
        </Text>

        {/* DESAYUNO */}
        <Text style={styles.seccion}>
          ¿A qué hora desayunas normalmente?
        </Text>

        <TouchableOpacity
          style={[
            styles.selectorHora,
            desayuno && styles.selectorSeleccionado,
          ]}
          onPress={() =>
            abrirSelectorHora("desayuno")
          }
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.textoHora,
              desayuno && styles.textoHoraSeleccionado,
            ]}
          >
            {mostrarHora(desayuno)}
          </Text>
        </TouchableOpacity>

        {/* ALMUERZO */}
        <Text style={styles.seccion}>
          ¿A qué hora almuerzas normalmente?
        </Text>

        <TouchableOpacity
          style={[
            styles.selectorHora,
            almuerzo && styles.selectorSeleccionado,
          ]}
          onPress={() =>
            abrirSelectorHora("almuerzo")
          }
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.textoHora,
              almuerzo && styles.textoHoraSeleccionado,
            ]}
          >
            {mostrarHora(almuerzo)}
          </Text>
        </TouchableOpacity>

        {/* CENA */}
        <Text style={styles.seccion}>
          ¿A qué hora cenas normalmente?
        </Text>

        <TouchableOpacity
          style={[
            styles.selectorHora,
            cena && styles.selectorSeleccionado,
          ]}
          onPress={() =>
            abrirSelectorHora("cena")
          }
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.textoHora,
              cena && styles.textoHoraSeleccionado,
            ]}
          >
            {mostrarHora(cena)}
          </Text>
        </TouchableOpacity>

        {/* REGULARIDAD */}
        <Text style={styles.seccion}>
          ¿Tus horarios suelen ser regulares?
        </Text>

        <View style={styles.lista}>
          <TouchableOpacity
            style={[
              styles.opcion,
              horariosRegulares === true &&
                styles.opcionSeleccionada,
            ]}
            onPress={() =>
              setHorariosRegulares(true)
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoOpcion,
                horariosRegulares === true &&
                  styles.textoSeleccionado,
              ]}
            >
              Sí, normalmente mantengo los mismos
              horarios.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.opcion,
              horariosRegulares === false &&
                styles.opcionSeleccionada,
            ]}
            onPress={() =>
              setHorariosRegulares(false)
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoOpcion,
                horariosRegulares === false &&
                  styles.textoSeleccionado,
              ]}
            >
              No, mis horarios cambian bastante.
            </Text>
          </TouchableOpacity>
        </View>

        {/* TIEMPO DE COCINA */}
        <Text style={styles.seccion}>
          ¿Cuánto tiempo tienes para preparar tus comidas?
        </Text>

        <View style={styles.lista}>
          {tiempos.map((tiempo) => {
            const seleccionado =
              tiempoCocina === tiempo;

            return (
              <TouchableOpacity
                key={tiempo}
                style={[
                  styles.opcion,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  setTiempoCocina(tiempo)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoOpcion,
                    seleccionado &&
                      styles.textoSeleccionado,
                  ]}
                >
                  {tiempo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BOTÓN */}
        <TouchableOpacity
          style={[
            styles.boton,
            cargando &&
              styles.botonDeshabilitado,
          ]}
          onPress={guardarDatos}
          disabled={cargando}
          activeOpacity={0.8}
        >
          <Text style={styles.textoBoton}>
            {cargando
              ? "Guardando..."
              : "Continuar"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SELECTOR DE HORA */}
      {campoActivo && (
        <DateTimePicker
          value={obtenerHoraActiva()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={cambiarHora}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAFF",
  },

  contenido: {
    paddingHorizontal: 30,
    paddingVertical: 25,
    paddingBottom: 40,
  },

  volver: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 5,
  },

  textoVolver: {
    color: "#2196F3",
    fontSize: 15,
    fontWeight: "600",
  },

  paso: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },

  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 18,
  },

  titulo: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },

  seccion: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
    marginTop: 8,
  },

  selectorHora: {
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  selectorSeleccionado: {
    borderColor: "#2196F3",
    backgroundColor: "#EAF5FF",
  },

  textoHora: {
    fontSize: 16,
    color: "#777",
    fontWeight: "600",
  },

  textoHoraSeleccionado: {
    color: "#2196F3",
  },

  lista: {
    gap: 10,
    marginBottom: 25,
  },

  opcion: {
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  opcionSeleccionada: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  textoOpcion: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },

  textoSeleccionado: {
    color: "#FFFFFF",
  },

  boton: {
    height: 52,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});

