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

export default function EquiposScreen() {
  const { usuarioId } = useLocalSearchParams<{
    usuarioId: string;
  }>();

  const [equipos, setEquipos] = useState<string[]>([]);
  const [otroEquipo, setOtroEquipo] = useState("");
  const [cargando, setCargando] = useState(false);

  const equiposDisponibles = [
    "Cocina",
    "Refrigerador",
    "Microondas",
    "Licuadora",
    "Freidora de aire",
  ];

  const cambiarEquipo = (equipo: string) => {
    setEquipos((actuales) => {
      if (actuales.includes(equipo)) {
        return actuales.filter((item) => item !== equipo);
      }

      return [...actuales, equipo];
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
        "http://10.0.2.2:3000/api/equipos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuarioId: String(usuarioId),
            equipos,
            otroEquipo: otroEquipo.trim(),
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "Error",
          datos.mensaje ||
            "No se pudieron guardar los equipos."
        );
        return;
      }

      Alert.alert(
        "Perfil completado",
        "Toda tu información inicial fue guardada correctamente.",
        [
          {
            text: "Ir al inicio",
            onPress: () => {
              router.replace({
                pathname: "/inicio",
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
        "Error al guardar equipos:",
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
          Paso 8 de 8
        </Text>

        {/* LOGO */}
        <Text style={styles.logo}>
          DietApp
        </Text>

        {/* TÍTULO */}
        <Text style={styles.titulo}>
          Equipos disponibles
        </Text>

        <Text style={styles.subtitulo}>
          Selecciona los equipos que tienes disponibles
          para preparar tus comidas.
        </Text>

        {/* EQUIPOS */}
        <Text style={styles.seccion}>
          ¿Qué tienes disponible en casa?
        </Text>

        <Text style={styles.ayuda}>
          Puedes seleccionar varias opciones.
        </Text>

        <View style={styles.lista}>
          {equiposDisponibles.map((equipo) => {
            const seleccionado =
              equipos.includes(equipo);

            return (
              <TouchableOpacity
                key={equipo}
                style={[
                  styles.opcion,
                  seleccionado &&
                    styles.opcionSeleccionada,
                ]}
                onPress={() =>
                  cambiarEquipo(equipo)
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
                    {equipo}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* OTRO EQUIPO */}
        <Text style={styles.seccion}>
          ¿Tienes otro equipo?
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Escribe otro equipo..."
          placeholderTextColor="#999"
          value={otroEquipo}
          onChangeText={setOtroEquipo}
        />

        {/* INFORMACIÓN */}
        <View style={styles.info}>
          <Text style={styles.infoTitulo}>
            ¿Por qué preguntamos esto?
          </Text>

          <Text style={styles.infoTexto}>
            DietApp podrá tener en cuenta los equipos
            disponibles al recomendar preparaciones y
            recetas.
          </Text>
        </View>

        {/* BOTÓN FINALIZAR */}
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
              : "Finalizar"}
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
    marginBottom: 12,
  },

  lista: {
    gap: 10,
    marginBottom: 25,
  },

  opcion: {
    minHeight: 54,
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
    marginBottom: 22,
  },

  info: {
    backgroundColor: "#EAF5FF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },

  infoTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 5,
  },

  infoTexto: {
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
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



