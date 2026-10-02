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

export default function DatosPersonalesScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [cargando, setCargando] = useState(false);

  const guardarDatos = async () => {
    if (!edad.trim() || !sexo || !peso.trim() || !altura.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Completa todos los datos para continuar."
      );
      return;
    }

    if (!usuarioId) {
      Alert.alert(
        "Error",
        "No se encontró el usuario registrado."
      );
      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        "http://10.0.2.2:3000/api/perfil",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: usuarioId,
            edad: edad.trim(),
            sexo,
            peso: peso.trim(),
            altura: altura.trim(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje || "No se pudieron guardar los datos."
        );
        return;
      }

      Alert.alert(
        "Datos guardados",
        "Tus datos personales se guardaron correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/actividad-objetivo",
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
        "Error al guardar datos personales:",
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
        keyboardShouldPersistTaps="handled"
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
          Paso 2 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Completa tus datos
        </Text>

        <Text style={styles.subtitulo}>
          Estos datos nos ayudarán a personalizar tu experiencia.
        </Text>

        <View style={styles.formulario}>

          {/* EDAD */}
          <Text style={styles.etiqueta}>
            Edad
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 20"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={edad}
            onChangeText={setEdad}
            maxLength={3}
          />

          {/* SEXO */}
          <Text style={styles.etiqueta}>
            Sexo
          </Text>

          <TouchableOpacity
            style={[
              styles.opcion,
              sexo === "Masculino" &&
                styles.opcionSeleccionada,
            ]}
            onPress={() => setSexo("Masculino")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoOpcion,
                sexo === "Masculino" &&
                  styles.textoOpcionSeleccionada,
              ]}
            >
              Masculino
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.opcion,
              sexo === "Femenino" &&
                styles.opcionSeleccionada,
            ]}
            onPress={() => setSexo("Femenino")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoOpcion,
                sexo === "Femenino" &&
                  styles.textoOpcionSeleccionada,
              ]}
            >
              Femenino
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.opcion,
              sexo === "Prefiero no decirlo" &&
                styles.opcionSeleccionada,
            ]}
            onPress={() =>
              setSexo("Prefiero no decirlo")
            }
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.textoOpcion,
                sexo === "Prefiero no decirlo" &&
                  styles.textoOpcionSeleccionada,
              ]}
            >
              Prefiero no decirlo
            </Text>
          </TouchableOpacity>

          {/* PESO */}
          <Text style={styles.etiqueta}>
            Peso
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 65"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={peso}
            onChangeText={setPeso}
          />

          <Text style={styles.unidad}>
            Peso en kilogramos
          </Text>

          {/* ALTURA */}
          <Text style={styles.etiqueta}>
            Altura
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: 170"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={altura}
            onChangeText={setAltura}
          />

          <Text style={styles.unidad}>
            Altura en centímetros
          </Text>

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

        </View>
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

  formulario: {
    width: "100%",
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 5,
  },

  input: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 6,
    color: "#222",
  },

  unidad: {
    color: "#777",
    fontSize: 13,
    marginBottom: 18,
  },

  opcion: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  opcionSeleccionada: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },

  textoOpcion: {
    color: "#333",
    fontSize: 15,
  },

  textoOpcionSeleccionada: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  boton: {
    height: 52,
    backgroundColor: "#2196F3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
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

