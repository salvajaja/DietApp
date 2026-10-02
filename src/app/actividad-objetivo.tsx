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

export default function ActividadObjetivoScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [nivelActividad, setNivelActividad] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [cargando, setCargando] = useState(false);

  const guardarDatos = async () => {
    if (!nivelActividad || !objetivo) {
      Alert.alert(
        "Campos incompletos",
        "Selecciona tu nivel de actividad y tu objetivo."
      );
      return;
    }

    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        "https://dietapp-backend.onrender.com/api/actividad-objetivo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            nivelActividad,
            objetivo,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje ||
            "No se pudieron guardar los datos."
        );
        return;
      }

      Alert.alert(
        "Datos guardados",
        "Tu actividad y objetivo fueron guardados correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/alimentacion",
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
        "Error al guardar actividad y objetivo:",
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

  const actividades = [
    {
      titulo: "Sedentario",
      descripcion: "Poca o ninguna actividad física.",
    },
    {
      titulo: "Ligero",
      descripcion: "Actividad ligera durante la semana.",
    },
    {
      titulo: "Moderado",
      descripcion: "Actividad física regular.",
    },
    {
      titulo: "Alto",
      descripcion: "Actividad física frecuente.",
    },
    {
      titulo: "Muy alto",
      descripcion: "Actividad física intensa y frecuente.",
    },
  ];

  const objetivos = [
    "Bajar de peso",
    "Mantener el peso",
    "Subir de peso",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        {/* BOTÓN VOLVER */}
        <TouchableOpacity
          style={styles.volver}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVolver}>← Volver</Text>
        </TouchableOpacity>

        {/* PROGRESO */}
        <Text style={styles.paso}>
          Paso 3 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Actividad y objetivo
        </Text>

        <Text style={styles.subtitulo}>
          Cuéntanos un poco sobre tu actividad física y tu objetivo.
        </Text>

        {/* ACTIVIDAD */}
        <Text style={styles.seccion}>
          ¿Cuál es tu nivel de actividad física?
        </Text>

        <View style={styles.lista}>
          {actividades.map((actividad) => {
            const seleccionado =
              nivelActividad === actividad.titulo;

            return (
              <TouchableOpacity
                key={actividad.titulo}
                style={[
                  styles.tarjeta,
                  seleccionado &&
                    styles.tarjetaSeleccionada,
                ]}
                onPress={() =>
                  setNivelActividad(actividad.titulo)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tituloTarjeta,
                    seleccionado &&
                      styles.textoSeleccionado,
                  ]}
                >
                  {actividad.titulo}
                </Text>

                <Text
                  style={[
                    styles.descripcionTarjeta,
                    seleccionado &&
                      styles.textoSeleccionadoSecundario,
                  ]}
                >
                  {actividad.descripcion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* OBJETIVO */}
        <Text style={styles.seccion}>
          ¿Cuál es tu objetivo?
        </Text>

        <View style={styles.lista}>
          {objetivos.map((item) => {
            const seleccionado = objetivo === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.opcionObjetivo,
                  seleccionado &&
                    styles.opcionObjetivoSeleccionada,
                ]}
                onPress={() => setObjetivo(item)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoObjetivo,
                    seleccionado &&
                      styles.textoSeleccionado,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BOTÓN CONTINUAR */}
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
    marginBottom: 14,
    marginTop: 8,
  },

  lista: {
    gap: 10,
    marginBottom: 28,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 14,
    padding: 16,
  },

  tarjetaSeleccionada: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  tituloTarjeta: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },

  descripcionTarjeta: {
    fontSize: 14,
    color: "#777",
    lineHeight: 20,
  },

  textoSeleccionado: {
    color: "#FFFFFF",
  },

  textoSeleccionadoSecundario: {
    color: "#EAF5FF",
  },

  opcionObjetivo: {
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  opcionObjetivoSeleccionada: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  textoObjetivo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
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


