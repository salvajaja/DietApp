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

export default function AlergiasScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [alergias, setAlergias] = useState<string[]>([]);
  const [intolerancias, setIntolerancias] = useState<string[]>([]);
  const [otraAlergia, setOtraAlergia] = useState("");
  const [otraIntolerancia, setOtraIntolerancia] = useState("");
  const [cargando, setCargando] = useState(false);

  const alimentos = [
    "Leche",
    "Huevo",
    "Maní",
    "Frutos secos",
    "Pescado",
    "Mariscos",
    "Soya",
    "Trigo",
  ];

  const cambiarAlergia = (alimento: string) => {
    setAlergias((actuales) => {
      if (actuales.includes(alimento)) {
        return actuales.filter((item) => item !== alimento);
      }

      return [...actuales, alimento];
    });
  };

  const cambiarIntolerancia = (alimento: string) => {
    setIntolerancias((actuales) => {
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

    try {
      setCargando(true);

      const respuesta = await fetch(
        "http://10.0.2.2:3000/api/alergias",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            alergias,
            intolerancias,
            otraAlergia: otraAlergia.trim(),
            otraIntolerancia: otraIntolerancia.trim(),
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
        "Tus alergias e intolerancias fueron guardadas correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/preferencias",
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
        "Error al guardar alergias:",
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

  const renderOpcion = (
    alimento: string,
    seleccionados: string[],
    cambiarSeleccion: (alimento: string) => void
  ) => {
    const seleccionado = seleccionados.includes(alimento);

    return (
      <TouchableOpacity
        key={alimento}
        style={[
          styles.opcion,
          seleccionado && styles.opcionSeleccionada,
        ]}
        onPress={() => cambiarSeleccion(alimento)}
        activeOpacity={0.8}
      >
        <View style={styles.fila}>
          <View
            style={[
              styles.check,
              seleccionado && styles.checkSeleccionado,
            ]}
          >
            {seleccionado && (
              <Text style={styles.checkTexto}>✓</Text>
            )}
          </View>

          <Text
            style={[
              styles.textoOpcion,
              seleccionado && styles.textoSeleccionado,
            ]}
          >
            {alimento}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
          Paso 5 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Alergias e intolerancias
        </Text>

        <Text style={styles.subtitulo}>
          Selecciona los alimentos que debes evitar
          para que nuestras recomendaciones los tengan
          en cuenta.
        </Text>

        {/* ALERGIAS */}
        <Text style={styles.seccion}>
          ¿Tienes alguna alergia alimentaria?
        </Text>

        <Text style={styles.ayuda}>
          Puedes seleccionar varias opciones.
        </Text>

        <View style={styles.lista}>
          {alimentos.map((alimento) =>
            renderOpcion(
              alimento,
              alergias,
              cambiarAlergia
            )
          )}
        </View>

        {/* OTRA ALERGIA */}
        <Text style={styles.seccion}>
          Otra alergia
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe otra alergia..."
          placeholderTextColor="#999"
          value={otraAlergia}
          onChangeText={setOtraAlergia}
        />

        {/* INTOLERANCIAS */}
        <Text style={styles.seccion}>
          ¿Tienes alguna intolerancia alimentaria?
        </Text>

        <Text style={styles.ayuda}>
          Puedes seleccionar varias opciones.
        </Text>

        <View style={styles.lista}>
          {alimentos.map((alimento) =>
            renderOpcion(
              alimento,
              intolerancias,
              cambiarIntolerancia
            )
          )}
        </View>

        {/* OTRA INTOLERANCIA */}
        <Text style={styles.seccion}>
          Otra intolerancia
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe otra intolerancia..."
          placeholderTextColor="#999"
          value={otraIntolerancia}
          onChangeText={setOtraIntolerancia}
        />

        {/* BOTÓN */}
        <TouchableOpacity
          style={[
            styles.boton,
            cargando && styles.botonDeshabilitado,
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
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#222",
    marginBottom: 25,
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

