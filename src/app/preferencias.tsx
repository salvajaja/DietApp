import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function PreferenciasScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [alimentosGustanTexto, setAlimentosGustanTexto] =
    useState("");

  const [alimentosNoGustanTexto, setAlimentosNoGustanTexto] =
    useState("");

  const [comidasPorDia, setComidasPorDia] =
    useState<number | null>(null);

  const [presupuesto, setPresupuesto] =
    useState("");

  const [cargando, setCargando] = useState(false);

  const cantidadesComidas = [3, 4, 5, 6];

  const presupuestos = [
    "Bajo",
    "Medio",
    "Alto",
  ];

  const convertirTextoALista = (texto: string) => {
    return texto
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const guardarDatos = async () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );
      return;
    }

    if (!comidasPorDia) {
      Alert.alert(
        "Campo incompleto",
        "Selecciona cuántas comidas haces al día."
      );
      return;
    }

    if (!presupuesto) {
      Alert.alert(
        "Campo incompleto",
        "Selecciona tu presupuesto."
      );
      return;
    }

    try {
      setCargando(true);

      const alimentosGustan =
        convertirTextoALista(
          alimentosGustanTexto
        );

      const alimentosNoGustan =
        convertirTextoALista(
          alimentosNoGustanTexto
        );

      const respuesta = await fetch(
        "https://dietapp-backend.onrender.com/api/preferencias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            alimentosGustan,
            alimentosNoGustan,
            comidasPorDia,
            presupuesto,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje ||
            "No se pudieron guardar las preferencias."
        );
        return;
      }

      Alert.alert(
        "Preferencias guardadas",
        "Tus preferencias fueron guardadas correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/rutina",
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
        "Error al guardar preferencias:",
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          Paso 6 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Tus preferencias
        </Text>

        <Text style={styles.subtitulo}>
          Cuéntanos qué alimentos prefieres y cómo
          organizas tus comidas.
        </Text>

        {/* ALIMENTOS QUE GUSTAN */}
        <Text style={styles.seccion}>
          Alimentos que te gustan
        </Text>

        <Text style={styles.ayuda}>
          Escribe varios separados por comas.
        </Text>

        <TextInput
          style={styles.inputGrande}
          placeholder="Ejemplo: arroz, pollo, plátano, avena"
          placeholderTextColor="#999"
          value={alimentosGustanTexto}
          onChangeText={setAlimentosGustanTexto}
          multiline
        />

        {/* ALIMENTOS QUE NO GUSTAN */}
        <Text style={styles.seccion}>
          Alimentos que no te gustan
        </Text>

        <Text style={styles.ayuda}>
          También puedes escribir varios separados por comas.
        </Text>

        <TextInput
          style={styles.inputGrande}
          placeholder="Ejemplo: brócoli, pescado, avena"
          placeholderTextColor="#999"
          value={alimentosNoGustanTexto}
          onChangeText={setAlimentosNoGustanTexto}
          multiline
        />

        {/* COMIDAS POR DÍA */}
        <Text style={styles.seccion}>
          ¿Cuántas comidas haces al día?
        </Text>

        <View style={styles.listaHorizontal}>
          {cantidadesComidas.map((cantidad) => {
            const seleccionado =
              comidasPorDia === cantidad;

            return (
              <TouchableOpacity
                key={cantidad}
                style={[
                  styles.opcionCantidad,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  setComidasPorDia(cantidad)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.textoCantidad,
                    seleccionado &&
                      styles.textoSeleccionado,
                  ]}
                >
                  {cantidad}
                </Text>

                <Text
                  style={[
                    styles.textoComidas,
                    seleccionado &&
                      styles.textoComidasSeleccionado,
                  ]}
                >
                  comidas
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PRESUPUESTO */}
        <Text style={styles.seccion}>
          ¿Cuál es tu presupuesto para alimentación?
        </Text>

        <View style={styles.lista}>
          {presupuestos.map((item) => {
            const seleccionado =
              presupuesto === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.opcion,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  setPresupuesto(item)
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
                  {item}
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
    marginBottom: 8,
    marginTop: 8,
  },

  ayuda: {
    fontSize: 13,
    color: "#777",
    marginBottom: 10,
  },

  inputGrande: {
    minHeight: 80,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
    textAlignVertical: "top",
    marginBottom: 22,
  },

  lista: {
    gap: 10,
    marginBottom: 25,
  },

  listaHorizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },

  opcionCantidad: {
    width: "47%",
    minHeight: 72,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
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

  textoCantidad: {
    color: "#333",
    fontSize: 22,
    fontWeight: "bold",
  },

  textoComidas: {
    color: "#777",
    fontSize: 13,
    marginTop: 3,
  },

  textoComidasSeleccionado: {
    color: "#EAF5FF",
  },

  textoOpcion: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
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
