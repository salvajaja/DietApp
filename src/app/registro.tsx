import { router } from "expo-router";
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

export default function RegistroScreen() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarse = async () => {
    // Validar campos
    if (
      !nombre.trim() ||
      !correo.trim() ||
      !contrasena ||
      !confirmarContrasena
    ) {
      Alert.alert(
        "Campos incompletos",
        "Completa todos los campos."
      );
      return;
    }

    // Validar que las contraseñas coincidan
    if (contrasena !== confirmarContrasena) {
      Alert.alert(
        "Contraseñas diferentes",
        "Las contraseñas no coinciden."
      );
      return;
    }

    try {
      setCargando(true);

      // Enviar datos al backend
      const respuesta = await fetch(
        "https://dietapp-backend.onrender.com/api/registro",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            correo: correo.trim(),
            contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      // Si el servidor devuelve un error
      if (!respuesta.ok) {
        Alert.alert(
          "No se pudo completar el registro",
          datos.mensaje || "Ocurrió un error."
        );
        return;
      }

      // Registro realizado correctamente
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta fue creada correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace({
                pathname: "/datos-personales",
                params: {
                  usuarioId: String(datos.usuario.id),
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al registrar:", error);

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
      >
        {/* Botón volver */}
        <TouchableOpacity
          style={styles.volver}
          onPress={() => router.back()}
        >
          <Text style={styles.textoVolver}>← Volver</Text>
        </TouchableOpacity>

        {/* Logo */}
        <Text style={styles.logo}>DietApp</Text>

        {/* Título */}
        <Text style={styles.titulo}>
          Crear cuenta
        </Text>

        {/* Subtítulo */}
        <Text style={styles.subtitulo}>
          Regístrate para comenzar a personalizar tu experiencia
        </Text>

        <View style={styles.formulario}>
          {/* Nombre */}
          <Text style={styles.etiqueta}>Nombre</Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre"
            placeholderTextColor="#999"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          {/* Correo */}
          <Text style={styles.etiqueta}>
            Correo electrónico
          </Text>

          <TextInput
            style={styles.input}
            placeholder="ejemplo@gmail.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={correo}
            onChangeText={setCorreo}
          />

          {/* Contraseña */}
          <Text style={styles.etiqueta}>
            Contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={contrasena}
            onChangeText={setContrasena}
          />

          {/* Confirmar contraseña */}
          <Text style={styles.etiqueta}>
            Confirmar contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
          />

          {/* Botón registrar */}
          <TouchableOpacity
            style={[
              styles.boton,
              cargando && styles.botonDeshabilitado,
            ]}
            onPress={registrarse}
            disabled={cargando}
          >
            <Text style={styles.textoBoton}>
              {cargando ? "Registrando..." : "Registrarse"}
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
  },

  volver: {
    marginBottom: 20,
  },

  textoVolver: {
    color: "#2196F3",
    fontSize: 15,
    fontWeight: "600",
  },

  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 20,
  },

  titulo: {
    fontSize: 28,
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
    marginBottom: 35,
  },

  formulario: {
    width: "100%",
  },

  etiqueta: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
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


