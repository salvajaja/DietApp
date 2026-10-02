import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(true);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // ==========================================
  // COMPROBAR SESIÓN AL ABRIR LA APP
  // ==========================================

  useEffect(() => {
    comprobarSesion();
  }, []);

  const comprobarSesion = async () => {
    try {
      const usuarioGuardado = await AsyncStorage.getItem("usuario");

      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);

        if (usuario?.id) {
          router.replace({
            pathname: "/inicio",
            params: {
              usuarioId: String(usuario.id),
            },
          });

          return;
        }
      }
    } catch (error) {
      console.error("Error comprobando sesión:", error);
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  const iniciarSesion = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert(
        "Campos incompletos",
        "Ingresa tu correo y contraseña."
      );
      return;
    }

    try {
      setIniciandoSesion(true);

      const respuesta = await fetch(
        "http://10.0.2.2:3000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correo.trim().toLowerCase(),
            contrasena: contrasena,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert(
          "No se pudo iniciar sesión",
          datos.mensaje ||
            "Correo o contraseña incorrectos."
        );
        return;
      }

      // ==========================================
      // GUARDAR USUARIO
      // ==========================================

      await AsyncStorage.setItem(
        "usuario",
        JSON.stringify({
          id: datos.usuario.id,
          nombre: datos.usuario.nombre,
          correo: datos.usuario.correo,
        })
      );

      // ==========================================
      // IR A INICIO
      // ==========================================

      router.replace({
        pathname: "/inicio",
        params: {
          usuarioId: String(datos.usuario.id),
        },
      });
    } catch (error) {
      console.error("Error de login:", error);

      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose."
      );
    } finally {
      setIniciandoSesion(false);
    }
  };

  // ==========================================
  // PANTALLA DE CARGA
  // ==========================================

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cargandoContainer}>
          <Text style={styles.logo}>DietApp</Text>

          <ActivityIndicator
            size="large"
            color="#2196F3"
          />

          <Text style={styles.textoCargando}>
            Comprobando sesión...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // LOGIN
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contenido}>

        <Text style={styles.logo}>DietApp</Text>

        <Text style={styles.titulo}>
          Bienvenido
        </Text>

        <Text style={styles.subtitulo}>
          Organiza tu alimentación y alcanza tus objetivos
        </Text>

        <View style={styles.formulario}>

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
            editable={!iniciandoSesion}
          />

          <Text style={styles.etiqueta}>
            Contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
            editable={!iniciandoSesion}
          />

          <TouchableOpacity
            style={[
              styles.boton,
              iniciandoSesion &&
                styles.botonDeshabilitado,
            ]}
            onPress={iniciarSesion}
            disabled={iniciandoSesion}
          >
            {iniciandoSesion ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBoton}>
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonRegistro}
            onPress={() => router.push("/registro")}
            disabled={iniciandoSesion}
          >
            <Text style={styles.textoRegistro}>
              ¿No tienes una cuenta? Regístrate
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FAFF",
  },

  contenido: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  cargandoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#2196F3",
    textAlign: "center",
    marginBottom: 25,
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

  textoCargando: {
    marginTop: 15,
    fontSize: 15,
    color: "#666",
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
    opacity: 0.7,
  },

  textoBoton: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  botonRegistro: {
    marginTop: 22,
    alignItems: "center",
  },

  textoRegistro: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
  },
});

