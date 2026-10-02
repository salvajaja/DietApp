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

export default function AlimentacionScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [tipoAlimentacion, setTipoAlimentacion] = useState("");
  const [restricciones, setRestricciones] = useState<string[]>([]);
  const [otroDetalle, setOtroDetalle] = useState("");
  const [cargando, setCargando] = useState(false);

  const tiposAlimentacion = [
    "Sin restricciones",
    "Vegetariano",
    "Vegano",
    "Pescetariano",
  ];

  const alimentos = [
    "Carne de res",
    "Cerdo",
    "Pollo",
    "Pescado",
    "Mariscos",
  ];

  const seleccionarTipo = (tipo: string) => {
    setTipoAlimentacion(tipo);

    // Si selecciona sin restricciones,
    // limpiamos las restricciones de alimentos.
    if (tipo === "Sin restricciones") {
      setRestricciones([]);
      setOtroDetalle("");
    }
  };

  const cambiarRestriccion = (alimento: string) => {
    setRestricciones((actuales) => {
      if (actuales.includes(alimento)) {
        return actuales.filter((item) => item !== alimento);
      }

      return [...actuales, alimento];
    });
  };

  const guardarDatos = async () => {
    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario."
      );
      return;
    }

    if (!tipoAlimentacion) {
      Alert.alert(
        "Campo incompleto",
        "Selecciona tu tipo de alimentación."
      );
      return;
    }

    if (
      restricciones.length === 0 &&
      !otroDetalle.trim() &&
      tipoAlimentacion !== "Sin restricciones"
    ) {
      // Permitimos continuar aunque no marque
      // alimentos específicos cuando ya eligió
      // vegetariano, vegano o pescetariano.
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        "https://dietapp-backend.onrender.com/api/alimentacion",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            tipoAlimentacion,
            restricciones,
            otroDetalle: otroDetalle.trim(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje ||
            "No se pudo guardar la información."
        );
        return;
      }

      Alert.alert(
        "Datos guardados",
        "Tu información de alimentación se guardó correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/alergias",
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
        "Error al guardar alimentación:",
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
          Paso 4 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Alimentación
        </Text>

        <Text style={styles.subtitulo}>
          Cuéntanos qué tipo de alimentación sigues
          y qué alimentos prefieres evitar.
        </Text>

        {/* TIPO DE ALIMENTACIÓN */}
        <Text style={styles.seccion}>
          Tipo de alimentación
        </Text>

        <View style={styles.lista}>
          {tiposAlimentacion.map((tipo) => {
            const seleccionado =
              tipoAlimentacion === tipo;

            return (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.opcion,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  seleccionarTipo(tipo)
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
                  {tipo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ALIMENTOS QUE NO CONSUME */}
        <Text style={styles.seccion}>
          ¿Hay alimentos que no consumes?
        </Text>

        <Text style={styles.ayuda}>
          Puedes seleccionar varios.
        </Text>

        <View style={styles.lista}>
          {alimentos.map((alimento) => {
            const seleccionado =
              restricciones.includes(alimento);

            return (
              <TouchableOpacity
                key={alimento}
                style={[
                  styles.opcion,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  cambiarRestriccion(alimento)
                }
                activeOpacity={0.8}
              >
                <View style={styles.fila}>
                  <View
                    style={[
                      styles.check,
                      seleccionado &&
                        styles.checkSeleccionado,
                    ]}
                  >
                    {seleccionado && (
                      <Text style={styles.checkTexto}>
                        ✓
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.textoOpcion,
                      seleccionado &&
                        styles.textoSeleccionado,
                    ]}
                  >
                    {alimento}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* OTRO */}
        <Text style={styles.seccion}>
          Otro alimento que no consumes
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe un alimento..."
          placeholderTextColor="#999"
          value={otroDetalle}
          onChangeText={setOtroDetalle}
          multiline
        />

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
    marginBottom: 10,
    marginTop: 8,
  },

  ayuda: {
    fontSize: 13,
    color: "#777",
    marginBottom: 12,
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

  fila: {
    flexDirection: "row",
    alignItems: "center",
  },

  check: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#B7CAD7",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },

  checkSeleccionado: {
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },

  checkTexto: {
    color: "#2196F3",
    fontSize: 15,
    fontWeight: "bold",
  },

  textoOpcion: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },

  textoSeleccionado: {
    color: "#FFFFFF",
  },

  input: {
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
    marginBottom: 20,
  },

  boton: {
    height: 52,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
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


