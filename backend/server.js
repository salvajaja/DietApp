const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const Groq = require("groq-sdk");
const path = require("path");

// ============================================
// VARIABLES DE ENTORNO
// ============================================

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// ============================================
// CONEXIONES
// ============================================

const pool = require("./db");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// EXPRESS
// ============================================

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ============================================
// RUTA PRINCIPAL
// ============================================

app.get("/", (req, res) => {
  res.json({
    mensaje: "✅ Backend de DietApp funcionando",
  });
});

// ============================================
// PRUEBA DE CONEXIÓN CON POSTGRESQL
// ============================================

app.get("/api/prueba-db", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT NOW() AS fecha"
    );

    res.json({
      conectado: true,
      fecha: resultado.rows[0].fecha,
    });
  } catch (error) {
    console.error("❌ Error en PostgreSQL:", error);

    res.status(500).json({
      conectado: false,
      error: error.message,
    });
  }
});

// ================================
// LOGIN
// ================================

app.post("/api/login", async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        mensaje: "Correo y contraseña son obligatorios.",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const resultado = await pool.query(
      `
      SELECT id, nombre, correo, contrasena
      FROM usuarios
      WHERE correo = $1
      `,
      [correoNormalizado]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "El correo o la contraseña son incorrectos.",
      });
    }

    const usuario = resultado.rows[0];

    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasena
    );

    if (!contrasenaCorrecta) {
      return res.status(401).json({
        mensaje: "El correo o la contraseña son incorrectos.",
      });
    }

    return res.status(200).json({
      mensaje: "Inicio de sesión correcto.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor.",
    });
  }
});

// ============================================
// REGISTRO DE USUARIO
// ============================================

app.post("/api/registro", async (req, res) => {
  try {
    const {
      nombre,
      correo,
      contrasena,
    } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        mensaje: "Completa todos los campos.",
      });
    }

    const usuarioExistente = await pool.query(
      `SELECT id
       FROM usuarios
       WHERE correo = $1`,
      [correo.trim().toLowerCase()]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ese correo ya está registrado.",
      });
    }

    const contrasenaHash = await bcrypt.hash(
      contrasena,
      10
    );

    const resultado = await pool.query(
      `INSERT INTO usuarios
        (nombre, correo, contrasena)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, correo`,
      [
        nombre.trim(),
        correo.trim().toLowerCase(),
        contrasenaHash,
      ]
    );

    const usuario = resultado.rows[0];

    res.status(201).json({
      mensaje: "Usuario registrado correctamente.",
      usuario,
    });
  } catch (error) {
    console.error(
      "❌ Error al registrar usuario:",
      error
    );

    res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ============================================
// GUARDAR DATOS PERSONALES
// ============================================

app.post("/api/perfil", async (req, res) => {
  try {
    const {
      usuarioId,
      edad,
      sexo,
      peso,
      altura,
    } = req.body;

    if (
      !usuarioId ||
      !edad ||
      !sexo ||
      !peso ||
      !altura
    ) {
      return res.status(400).json({
        mensaje:
          "Completa todos los datos personales.",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO perfil_usuario
        (
          usuario_id,
          edad,
          sexo,
          peso,
          altura
        )
       VALUES ($1, $2, $3, $4, $5)

       ON CONFLICT (usuario_id)
       DO UPDATE SET
         edad = EXCLUDED.edad,
         sexo = EXCLUDED.sexo,
         peso = EXCLUDED.peso,
         altura = EXCLUDED.altura

       RETURNING *`,
      [
        usuarioId,
        Number(edad),
        sexo,
        Number(peso),
        Number(altura),
      ]
    );

    res.status(201).json({
      mensaje:
        "Datos personales guardados correctamente.",
      perfil: resultado.rows[0],
    });
  } catch (error) {
    console.error(
      "❌ Error al guardar perfil:",
      error
    );

    res.status(500).json({
      mensaje:
        "Error interno del servidor.",
      error: error.message,
    });
  }
});

// ============================================
// GUARDAR ACTIVIDAD FÍSICA Y OBJETIVO
// ============================================

app.post(
  "/api/actividad-objetivo",
  async (req, res) => {
    try {
      const {
        usuarioId,
        nivelActividad,
        objetivo,
      } = req.body;

      if (
        !usuarioId ||
        !nivelActividad ||
        !objetivo
      ) {
        return res.status(400).json({
          mensaje:
            "Completa el nivel de actividad y el objetivo.",
        });
      }

      const actividadesPermitidas = [
        "Sedentario",
        "Ligero",
        "Moderado",
        "Alto",
        "Muy alto",
      ];

      const objetivosPermitidos = [
        "Bajar de peso",
        "Mantener el peso",
        "Subir de peso",
      ];

      if (
        !actividadesPermitidas.includes(
          nivelActividad
        )
      ) {
        return res.status(400).json({
          mensaje:
            "El nivel de actividad no es válido.",
        });
      }

      if (
        !objetivosPermitidos.includes(
          objetivo
        )
      ) {
        return res.status(400).json({
          mensaje:
            "El objetivo no es válido.",
        });
      }

      const resultado = await pool.query(
        `INSERT INTO actividad_objetivo
          (
            usuario_id,
            nivel_actividad,
            objetivo
          )
         VALUES ($1, $2, $3)

         ON CONFLICT (usuario_id)
         DO UPDATE SET
           nivel_actividad = EXCLUDED.nivel_actividad,
           objetivo = EXCLUDED.objetivo

         RETURNING *`,
        [
          usuarioId,
          nivelActividad,
          objetivo,
        ]
      );

      res.status(201).json({
        mensaje:
          "Actividad y objetivo guardados correctamente.",
        datos: resultado.rows[0],
      });
    } catch (error) {
      console.error(
        "❌ Error al guardar actividad y objetivo:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GUARDAR ALIMENTACIÓN Y RESTRICCIONES
// ============================================

app.post(
  "/api/alimentacion",
  async (req, res) => {
    try {
      const {
        usuarioId,
        tipoAlimentacion,
        restricciones,
        otroDetalle,
      } = req.body;

      if (
        !usuarioId ||
        !tipoAlimentacion
      ) {
        return res.status(400).json({
          mensaje:
            "Selecciona tu tipo de alimentación.",
        });
      }

      const tiposPermitidos = [
        "Sin restricciones",
        "Vegetariano",
        "Vegano",
        "Pescetariano",
      ];

      const restriccionesPermitidas = [
        "Carne de res",
        "Cerdo",
        "Pollo",
        "Pescado",
        "Mariscos",
      ];

      if (
        !tiposPermitidos.includes(
          tipoAlimentacion
        )
      ) {
        return res.status(400).json({
          mensaje:
            "El tipo de alimentación no es válido.",
        });
      }

      if (!Array.isArray(restricciones)) {
        return res.status(400).json({
          mensaje:
            "Las restricciones deben enviarse correctamente.",
        });
      }

      const restriccionesValidas =
        restricciones.filter((item) =>
          restriccionesPermitidas.includes(
            item
          )
        );

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `DELETE FROM restricciones_alimentarias
           WHERE usuario_id = $1`,
          [usuarioId]
        );

        await client.query(
          `INSERT INTO restricciones_alimentarias
            (
              usuario_id,
              tipo,
              detalle
            )
           VALUES ($1, $2, $3)`,
          [
            usuarioId,
            tipoAlimentacion,
            null,
          ]
        );

        for (
          const restriccion of restriccionesValidas
        ) {
          await client.query(
            `INSERT INTO restricciones_alimentarias
              (
                usuario_id,
                tipo,
                detalle
              )
             VALUES ($1, $2, $3)`,
            [
              usuarioId,
              "Alimento no consumido",
              restriccion,
            ]
          );
        }

        if (
          otroDetalle &&
          otroDetalle.trim()
        ) {
          await client.query(
            `INSERT INTO restricciones_alimentarias
              (
                usuario_id,
                tipo,
                detalle
              )
             VALUES ($1, $2, $3)`,
            [
              usuarioId,
              "Otro",
              otroDetalle.trim(),
            ]
          );
        }

        await client.query("COMMIT");

        res.status(201).json({
          mensaje:
            "Información de alimentación guardada correctamente.",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "❌ Error al guardar alimentación:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GUARDAR ALERGIAS E INTOLERANCIAS
// ============================================

app.post(
  "/api/alergias",
  async (req, res) => {
    try {
      const {
        usuarioId,
        alergias,
        intolerancias,
        otraAlergia,
        otraIntolerancia,
      } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          mensaje:
            "No se encontró el usuario.",
        });
      }

      if (
        !Array.isArray(alergias) ||
        !Array.isArray(intolerancias)
      ) {
        return res.status(400).json({
          mensaje:
            "Los datos de alergias no tienen un formato válido.",
        });
      }

      const alimentosPermitidos = [
        "Leche",
        "Huevo",
        "Maní",
        "Frutos secos",
        "Pescado",
        "Mariscos",
        "Soya",
        "Trigo",
      ];

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `DELETE FROM alergias
           WHERE usuario_id = $1`,
          [usuarioId]
        );

        for (const alimento of alergias) {
          if (
            alimentosPermitidos.includes(
              alimento
            )
          ) {
            await client.query(
              `INSERT INTO alergias
                (
                  usuario_id,
                  alimento,
                  tipo
                )
               VALUES ($1, $2, $3)`,
              [
                usuarioId,
                alimento,
                "Alergia",
              ]
            );
          }
        }

        for (const alimento of intolerancias) {
          if (
            alimentosPermitidos.includes(
              alimento
            )
          ) {
            await client.query(
              `INSERT INTO alergias
                (
                  usuario_id,
                  alimento,
                  tipo
                )
               VALUES ($1, $2, $3)`,
              [
                usuarioId,
                alimento,
                "Intolerancia",
              ]
            );
          }
        }

        if (
          otraAlergia &&
          otraAlergia.trim()
        ) {
          await client.query(
            `INSERT INTO alergias
              (
                usuario_id,
                alimento,
                tipo
              )
             VALUES ($1, $2, $3)`,
            [
              usuarioId,
              otraAlergia.trim(),
              "Alergia",
            ]
          );
        }

        if (
          otraIntolerancia &&
          otraIntolerancia.trim()
        ) {
          await client.query(
            `INSERT INTO alergias
              (
                usuario_id,
                alimento,
                tipo
              )
             VALUES ($1, $2, $3)`,
            [
              usuarioId,
              otraIntolerancia.trim(),
              "Intolerancia",
            ]
          );
        }

        await client.query("COMMIT");

        res.status(201).json({
          mensaje:
            "Alergias e intolerancias guardadas correctamente.",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "❌ Error al guardar alergias:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GUARDAR PREFERENCIAS
// ============================================

app.post(
  "/api/preferencias",
  async (req, res) => {
    try {
      const {
        usuarioId,
        alimentosGustan,
        alimentosNoGustan,
        comidasPorDia,
        presupuesto,
      } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          mensaje:
            "No se encontró el usuario.",
        });
      }

      if (
        !comidasPorDia ||
        !presupuesto
      ) {
        return res.status(400).json({
          mensaje:
            "Completa la cantidad de comidas y el presupuesto.",
        });
      }

      const comidasPermitidas = [
        3,
        4,
        5,
        6,
      ];

      const presupuestosPermitidos = [
        "Bajo",
        "Medio",
        "Alto",
      ];

      const cantidadComidas =
        Number(comidasPorDia);

      if (
        !comidasPermitidas.includes(
          cantidadComidas
        )
      ) {
        return res.status(400).json({
          mensaje:
            "La cantidad de comidas no es válida.",
        });
      }

      if (
        !presupuestosPermitidos.includes(
          presupuesto
        )
      ) {
        return res.status(400).json({
          mensaje:
            "El presupuesto no es válido.",
        });
      }

      if (
        !Array.isArray(
          alimentosGustan
        ) ||
        !Array.isArray(
          alimentosNoGustan
        )
      ) {
        return res.status(400).json({
          mensaje:
            "Las preferencias de alimentos no tienen un formato válido.",
        });
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO preferencias
            (
              usuario_id,
              comidas_por_dia,
              presupuesto
            )
           VALUES ($1, $2, $3)

           ON CONFLICT (usuario_id)
           DO UPDATE SET
             comidas_por_dia = EXCLUDED.comidas_por_dia,
             presupuesto = EXCLUDED.presupuesto`,
          [
            usuarioId,
            cantidadComidas,
            presupuesto,
          ]
        );

        await client.query(
          `DELETE FROM alimentos_gustan
           WHERE usuario_id = $1`,
          [usuarioId]
        );

        for (const alimento of alimentosGustan) {
          if (
            alimento &&
            alimento.trim()
          ) {
            await client.query(
              `INSERT INTO alimentos_gustan
                (
                  usuario_id,
                  alimento
                )
               VALUES ($1, $2)`,
              [
                usuarioId,
                alimento.trim(),
              ]
            );
          }
        }

        await client.query(
          `DELETE FROM alimentos_no_gustan
           WHERE usuario_id = $1`,
          [usuarioId]
        );

        for (const alimento of alimentosNoGustan) {
          if (
            alimento &&
            alimento.trim()
          ) {
            await client.query(
              `INSERT INTO alimentos_no_gustan
                (
                  usuario_id,
                  alimento
                )
               VALUES ($1, $2)`,
              [
                usuarioId,
                alimento.trim(),
              ]
            );
          }
        }

        await client.query("COMMIT");

        res.status(201).json({
          mensaje:
            "Preferencias guardadas correctamente.",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "❌ Error al guardar preferencias:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GUARDAR RUTINA
// ============================================

app.post(
  "/api/rutina",
  async (req, res) => {
    try {
      const {
        usuarioId,
        desayuno,
        almuerzo,
        cena,
        horariosRegulares,
        tiempoCocina,
      } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          mensaje:
            "No se encontró el usuario.",
        });
      }

      if (
        !desayuno ||
        !almuerzo ||
        !cena ||
        horariosRegulares === null ||
        horariosRegulares === undefined ||
        !tiempoCocina
      ) {
        return res.status(400).json({
          mensaje:
            "Completa todos los datos de la rutina.",
        });
      }

      const tiemposPermitidos = [
        "Menos de 15 minutos",
        "15 - 30 minutos",
        "30 - 60 minutos",
        "Más de 1 hora",
      ];

      if (
        !tiemposPermitidos.includes(
          tiempoCocina
        )
      ) {
        return res.status(400).json({
          mensaje:
            "El tiempo de cocina no es válido.",
        });
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO horarios_comida
            (
              usuario_id,
              desayuno,
              almuerzo,
              cena,
              horarios_regulares
            )
           VALUES ($1, $2, $3, $4, $5)

           ON CONFLICT (usuario_id)
           DO UPDATE SET
             desayuno = EXCLUDED.desayuno,
             almuerzo = EXCLUDED.almuerzo,
             cena = EXCLUDED.cena,
             horarios_regulares =
               EXCLUDED.horarios_regulares`,
          [
            usuarioId,
            desayuno,
            almuerzo,
            cena,
            horariosRegulares,
          ]
        );

        await client.query(
          `INSERT INTO preferencias
            (
              usuario_id,
              tiempo_cocina
            )
           VALUES ($1, $2)

           ON CONFLICT (usuario_id)
           DO UPDATE SET
             tiempo_cocina =
               EXCLUDED.tiempo_cocina`,
          [
            usuarioId,
            tiempoCocina,
          ]
        );

        await client.query("COMMIT");

        res.status(201).json({
          mensaje:
            "Rutina guardada correctamente.",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "❌ Error al guardar rutina:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GUARDAR EQUIPOS
// ============================================

app.post(
  "/api/equipos",
  async (req, res) => {
    try {
      const {
        usuarioId,
        equipos,
        otroEquipo,
      } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          mensaje:
            "No se encontró el usuario.",
        });
      }

      if (!Array.isArray(equipos)) {
        return res.status(400).json({
          mensaje:
            "Los equipos deben enviarse correctamente.",
        });
      }

      const equiposPermitidos = [
        "Cocina",
        "Refrigerador",
        "Microondas",
        "Licuadora",
        "Freidora de aire",
      ];

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        await client.query(
          `DELETE FROM equipos_cocina
           WHERE usuario_id = $1`,
          [usuarioId]
        );

        for (const equipo of equipos) {
          if (
            equiposPermitidos.includes(
              equipo
            )
          ) {
            await client.query(
              `INSERT INTO equipos_cocina
                (
                  usuario_id,
                  equipo
                )
               VALUES ($1, $2)`,
              [
                usuarioId,
                equipo,
              ]
            );
          }
        }

        if (
          otroEquipo &&
          otroEquipo.trim()
        ) {
          await client.query(
            `INSERT INTO equipos_cocina
              (
                usuario_id,
                equipo
              )
             VALUES ($1, $2)`,
            [
              usuarioId,
              otroEquipo.trim(),
            ]
          );
        }

        await client.query("COMMIT");

        res.status(201).json({
          mensaje:
            "Equipos guardados correctamente.",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "❌ Error al guardar equipos:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error interno del servidor.",
        error: error.message,
      });
    }
  }
);

// ============================================
// OBTENER PERFIL COMPLETO DEL USUARIO
// ============================================

app.get(
  "/api/perfil-completo/:usuarioId",
  async (req, res) => {
    try {
      const { usuarioId } = req.params;

      const usuarioResult = await pool.query(
        `
        SELECT
          id,
          nombre,
          correo
        FROM usuarios
        WHERE id = $1
        `,
        [usuarioId]
      );

      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({
          mensaje: "Usuario no encontrado.",
        });
      }

      const perfilResult = await pool.query(
        `
        SELECT
          edad,
          sexo,
          peso,
          altura
        FROM perfil_usuario
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const actividadResult = await pool.query(
        `
        SELECT
          nivel_actividad,
          objetivo
        FROM actividad_objetivo
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const restriccionesResult = await pool.query(
        `
        SELECT
          tipo,
          detalle
        FROM restricciones_alimentarias
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const alergiasResult = await pool.query(
        `
        SELECT
          alimento,
          tipo
        FROM alergias
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const gustanResult = await pool.query(
        `
        SELECT
          alimento
        FROM alimentos_gustan
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const noGustanResult = await pool.query(
        `
        SELECT
          alimento
        FROM alimentos_no_gustan
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const preferenciasResult = await pool.query(
        `
        SELECT
          comidas_por_dia,
          presupuesto,
          tiempo_cocina
        FROM preferencias
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const horariosResult = await pool.query(
        `
        SELECT
          desayuno,
          almuerzo,
          cena,
          horarios_regulares
        FROM horarios_comida
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const equiposResult = await pool.query(
        `
        SELECT
          equipo
        FROM equipos_cocina
        WHERE usuario_id = $1
        `,
        [usuarioId]
      );

      const usuario = usuarioResult.rows[0];

      const perfil = perfilResult.rows[0] || {};
      const actividad = actividadResult.rows[0] || {};
      const preferencias =
        preferenciasResult.rows[0] || {};
      const horarios =
        horariosResult.rows[0] || {};

      const tipoAlimentacion =
        restriccionesResult.rows.find(
          (item) =>
            item.tipo !==
              "Alimento no consumido" &&
            item.tipo !== "Otro"
        )?.tipo ||
        "Sin restricciones";

      const alimentosRestringidos =
        restriccionesResult.rows
          .filter(
            (item) =>
              item.tipo ===
                "Alimento no consumido" ||
              item.tipo === "Otro"
          )
          .map(
            (item) => item.detalle
          )
          .filter(Boolean);

      const alergias =
        alergiasResult.rows
          .filter(
            (item) =>
              item.tipo === "Alergia"
          )
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const intolerancias =
        alergiasResult.rows
          .filter(
            (item) =>
              item.tipo === "Intolerancia"
          )
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const alimentosGustan =
        gustanResult.rows
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const alimentosNoGustan =
        noGustanResult.rows
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const equipos =
        equiposResult.rows
          .map(
            (item) => item.equipo
          )
          .filter(Boolean);

      res.status(200).json({
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
        },

        datosPersonales: {
          edad: perfil.edad,
          sexo: perfil.sexo,
          peso: perfil.peso,
          altura: perfil.altura,
        },

        actividadObjetivo: {
          nivelActividad:
            actividad.nivel_actividad,
          objetivo:
            actividad.objetivo,
        },

        alimentacion: {
          tipo: tipoAlimentacion,
          alimentosRestringidos:
            alimentosRestringidos,
        },

        seguridadAlimentaria: {
          alergias,
          intolerancias,
        },

        preferencias: {
          alimentosGustan,
          alimentosNoGustan,
          comidasPorDia:
            preferencias.comidas_por_dia,
          presupuesto:
            preferencias.presupuesto,
        },

        rutina: {
          desayuno:
            horarios.desayuno,
          almuerzo:
            horarios.almuerzo,
          cena:
            horarios.cena,
          horariosRegulares:
            horarios.horarios_regulares,
          tiempoCocina:
            preferencias.tiempo_cocina,
        },

        equiposCocina: equipos,
      });
    } catch (error) {
      console.error(
        "❌ Error obteniendo perfil completo:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener el perfil completo.",
        error: error.message,
      });
    }
  }
);

// ============================================
// OBTENER PLAN DE HOY
// ============================================

app.get(
  "/api/plan-diario/:usuarioId",
  async (req, res) => {
    try {
      const { usuarioId } = req.params;

      const resultado = await pool.query(
        `SELECT
           id,
           fecha,
           contenido
         FROM planes_ia
         WHERE usuario_id = $1
         AND fecha = CURRENT_DATE
         LIMIT 1`,
        [usuarioId]
      );

      if (resultado.rows.length === 0) {
        return res.json({
          existe: false,
          plan: null,
        });
      }

      res.json({
        existe: true,
        plan: resultado.rows[0],
      });
    } catch (error) {
      console.error(
        "❌ Error obteniendo plan:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener el plan.",
        error: error.message,
      });
    }
  }
);

// ============================================
// GENERAR PLAN CON GROQ
// ============================================

app.post(
  "/api/plan-diario/generar",
  async (req, res) => {
    try {
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          mensaje:
            "No se encontró el usuario.",
        });
      }

      const usuarioResult =
        await pool.query(
          `SELECT
             id,
             nombre
           FROM usuarios
           WHERE id = $1`,
          [usuarioId]
        );

      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({
          mensaje:
            "Usuario no encontrado.",
        });
      }

      const perfilResult =
        await pool.query(
          `SELECT
             edad,
             sexo,
             peso,
             altura
           FROM perfil_usuario
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const actividadResult =
        await pool.query(
          `SELECT
             nivel_actividad,
             objetivo
           FROM actividad_objetivo
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const restriccionesResult =
        await pool.query(
          `SELECT
             tipo,
             detalle
           FROM restricciones_alimentarias
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const alergiasResult =
        await pool.query(
          `SELECT
             alimento,
             tipo
           FROM alergias
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const gustanResult =
        await pool.query(
          `SELECT
             alimento
           FROM alimentos_gustan
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const noGustanResult =
        await pool.query(
          `SELECT
             alimento
           FROM alimentos_no_gustan
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const preferenciasResult =
        await pool.query(
          `SELECT
             comidas_por_dia,
             presupuesto,
             tiempo_cocina
           FROM preferencias
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const horariosResult =
        await pool.query(
          `SELECT
             desayuno,
             almuerzo,
             cena,
             horarios_regulares
           FROM horarios_comida
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const equiposResult =
        await pool.query(
          `SELECT
             equipo
           FROM equipos_cocina
           WHERE usuario_id = $1`,
          [usuarioId]
        );

      const usuario =
        usuarioResult.rows[0];

      const perfil =
        perfilResult.rows[0] || {};

      const actividad =
        actividadResult.rows[0] || {};

      const preferencias =
        preferenciasResult.rows[0] || {};

      const horarios =
        horariosResult.rows[0] || {};

      const tipoAlimentacion =
        restriccionesResult.rows.find(
          (item) =>
            item.tipo !==
              "Alimento no consumido" &&
            item.tipo !== "Otro"
        )?.tipo ||
        "Sin restricciones";

      const alimentosRestringidos =
        restriccionesResult.rows
          .filter(
            (item) =>
              item.tipo ===
                "Alimento no consumido" ||
              item.tipo === "Otro"
          )
          .map(
            (item) => item.detalle
          )
          .filter(Boolean);

      const alergias =
        alergiasResult.rows
          .filter(
            (item) =>
              item.tipo === "Alergia"
          )
          .map(
            (item) => item.alimento
          );

      const intolerancias =
        alergiasResult.rows
          .filter(
            (item) =>
              item.tipo ===
              "Intolerancia"
          )
          .map(
            (item) => item.alimento
          );

      const alimentosGustan =
        gustanResult.rows
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const alimentosNoGustan =
        noGustanResult.rows
          .map(
            (item) => item.alimento
          )
          .filter(Boolean);

      const equipos =
        equiposResult.rows
          .map(
            (item) => item.equipo
          )
          .filter(Boolean);

      const perfilCompleto = {
        nombre: usuario.nombre,

        datos_personales: {
          edad: perfil.edad,
          sexo: perfil.sexo,
          peso: perfil.peso,
          altura: perfil.altura,
        },

        actividad_objetivo: {
          nivel_actividad:
            actividad.nivel_actividad,
          objetivo:
            actividad.objetivo,
        },

        alimentacion: {
          tipo:
            tipoAlimentacion,
          alimentos_restringidos:
            alimentosRestringidos,
        },

        seguridad_alimentaria: {
          alergias,
          intolerancias,
        },

        preferencias: {
          alimentos_gustan:
            alimentosGustan,
          alimentos_no_gustan:
            alimentosNoGustan,
          comidas_por_dia:
            preferencias.comidas_por_dia,
          presupuesto:
            preferencias.presupuesto,
        },

        rutina: {
          desayuno:
            horarios.desayuno,
          almuerzo:
            horarios.almuerzo,
          cena:
            horarios.cena,
          horarios_regulares:
            horarios.horarios_regulares,
          tiempo_cocina:
            preferencias.tiempo_cocina,
        },

        equipos_cocina: equipos,
      };

      const systemPrompt = `
Eres el asistente de alimentación de DietApp.

Tu función es crear un plan alimentario diario
personalizado, variado y equilibrado utilizando
toda la información proporcionada del usuario.

PRIORIDADES:

1. Respeta estrictamente las alergias.
2. Respeta las intolerancias.
3. Nunca incluyas un alimento indicado como
   alergia o intolerancia.
4. Respeta las restricciones alimentarias.
5. Evita los alimentos que el usuario no desea consumir.
6. Considera los alimentos que le gustan como
   preferencias, no como una lista obligatoria.
7. No bases todo el plan únicamente en los alimentos
   que le gustan al usuario.
8. Utiliza algunos alimentos que le gustan cuando
   sean adecuados para el plan.
9. Complementa esos alimentos con otras opciones
   compatibles para conseguir variedad.
10. No es necesario utilizar todos los alimentos
    favoritos en un mismo día.
11. Evita repetir constantemente los mismos alimentos
    en las diferentes comidas.
12. Evita repetir la misma preparación varias veces
    durante el día.
13. Busca variedad entre las fuentes de alimentos,
    ingredientes y preparaciones.
14. Considera el presupuesto.
15. Considera el tiempo disponible para cocinar.
16. Considera los equipos disponibles.
17. Respeta los horarios indicados.
18. Respeta la cantidad de comidas indicada.
19. Si el usuario indicó pocos alimentos favoritos,
    igualmente debes crear un plan variado utilizando
    otras opciones compatibles.
20. Si una combinación de preferencias resulta difícil,
    prioriza las alergias e intolerancias y después
    las demás preferencias.
21. No hagas diagnósticos médicos.
22. No presentes el resultado como tratamiento médico.
23. No recomiendes restricciones extremas.
24. No uses lenguaje que juzgue el cuerpo o apariencia.
25. No inventes información que no esté en el perfil.
26. No proporciones instrucciones peligrosas.
27. Devuelve únicamente el JSON definido en el esquema.
`;

      const userPrompt = `
Genera el plan alimentario de hoy utilizando
este perfil.

Recuerda que los alimentos que le gustan al usuario
son preferencias y deben utilizarse solo como parte
de la personalización.

No limites el plan a esos alimentos.
Incluye algunos de ellos y complementa con otras
opciones compatibles para crear variedad.

Respeta estrictamente las alergias, intolerancias,
restricciones y alimentos que no le gustan.

También considera el presupuesto, tiempo de cocina,
equipos disponibles, horarios y cantidad de comidas.

Perfil del usuario:

${JSON.stringify(
  perfilCompleto,
  null,
  2
)}
`;

      const completion =
        await groq.chat.completions.create({
          model:
            "openai/gpt-oss-20b",

          reasoning_effort: "low",

          max_completion_tokens: 4096,

          messages: [
            {
              role: "system",
              content:
                systemPrompt,
            },
            {
              role: "user",
              content:
                userPrompt,
            },
          ],

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "plan_diario",

              strict: true,

              schema: {
                type: "object",

                properties: {
                  titulo: {
                    type: "string",
                  },

                  resumen: {
                    type: "string",
                  },

                  comidas: {
                    type: "array",

                    items: {
                      type: "object",

                      properties: {
                        tipo: {
                          type: "string",
                        },

                        hora: {
                          type: "string",
                        },

                        nombre: {
                          type: "string",
                        },

                        descripcion: {
                          type: "string",
                        },

                        ingredientes: {
                          type: "array",

                          items: {
                            type: "string",
                          },
                        },

                        preparacion: {
                          type: "string",
                        },
                      },

                      required: [
                        "tipo",
                        "hora",
                        "nombre",
                        "descripcion",
                        "ingredientes",
                        "preparacion",
                      ],

                      additionalProperties:
                        false,
                    },
                  },

                  recomendacion: {
                    type: "string",
                  },
                },

                required: [
                  "titulo",
                  "resumen",
                  "comidas",
                  "recomendacion",
                ],

                additionalProperties:
                  false,
              },
            },
          },
        });

      const contenido =
        JSON.parse(
          completion.choices[0]
            .message.content
        );

      const guardado =
        await pool.query(
          `INSERT INTO planes_ia
            (
              usuario_id,
              fecha,
              contenido
            )
           VALUES
            (
              $1,
              CURRENT_DATE,
              $2
            )

           ON CONFLICT
            (usuario_id, fecha)

           DO UPDATE SET
             contenido =
               EXCLUDED.contenido,
             creado_en =
               CURRENT_TIMESTAMP

           RETURNING
             id,
             fecha,
             contenido`,
          [
            usuarioId,
            JSON.stringify(
              contenido
            ),
          ]
        );

      res.status(201).json({
        mensaje:
          "Plan generado correctamente.",
        plan: guardado.rows[0],
      });

    } catch (error) {
      console.error(
        "❌ Error generando plan con Groq:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo generar el plan.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// COMIDAS REGISTRADAS
// =====================================================

// ============================================
// OBTENER COMIDAS REGISTRADAS DE HOY
// ============================================

app.get(
  "/api/comidas/:usuarioId",
  async (req, res) => {
    try {
      const { usuarioId } = req.params;

      const resultado = await pool.query(
        `
        SELECT
          id,
          fecha,
          tipo_comida,
          nombre,
          hora,
          completada,
          foto_url,
          verificacion_estado,
          verificacion_mensaje,
          confianza,
          hora_registro
        FROM comidas_registradas
        WHERE usuario_id = $1
          AND fecha = CURRENT_DATE
        ORDER BY
          CASE
            WHEN LOWER(tipo_comida) LIKE '%desay%' THEN 1
            WHEN LOWER(tipo_comida) LIKE '%media%' THEN 2
            WHEN LOWER(tipo_comida) LIKE '%almuerzo%' THEN 3
            WHEN LOWER(tipo_comida) LIKE '%cena%' THEN 4
            ELSE 5
          END,
          hora
        `,
        [usuarioId]
      );

      res.json({
        comidas: resultado.rows,
      });

    } catch (error) {
      console.error(
        "❌ Error obteniendo comidas:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error obteniendo las comidas registradas.",
      });
    }
  }
);

// =====================================================
// REGISTRAR COMIDA CON FOTO
// =====================================================

app.post(
  "/api/comidas/registrar",
  async (req, res) => {
    try {
      const {
        usuarioId,
        tipoComida,
        foto,
      } = req.body;

      // ============================================
      // 1. VALIDAR DATOS
      // ============================================

      if (
        !usuarioId ||
        !tipoComida ||
        !foto
      ) {
        return res.status(400).json({
          mensaje:
            "Debes seleccionar una comida y tomar una foto.",
        });
      }

      // ============================================
      // 2. VALIDAR FOTO
      // ============================================

      if (
        typeof foto !== "string" ||
        !foto.startsWith("data:image/")
      ) {
        return res.status(400).json({
          mensaje:
            "La foto enviada no tiene un formato válido.",
        });
      }

      // ============================================
      // 3. VALIDAR TAMAÑO
      // ============================================

      if (
        foto.length >
        8 * 1024 * 1024
      ) {
        return res.status(400).json({
          mensaje:
            "La foto es demasiado grande. Toma una foto de menor tamaño.",
        });
      }

      // ============================================
      // 4. OBTENER PLAN DE HOY
      // ============================================

      const planResult =
        await pool.query(
          `
          SELECT
            contenido
          FROM planes_ia
          WHERE usuario_id = $1
            AND fecha = CURRENT_DATE
          LIMIT 1
          `,
          [usuarioId]
        );

      if (
        planResult.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "No existe un plan alimentario para hoy.",
        });
      }

      const contenido =
        planResult.rows[0].contenido;

      const comidasPlan =
        contenido?.comidas || [];

      // ============================================
      // 5. BUSCAR LA COMIDA EN EL PLAN
      // ============================================

      const comidaPlan =
        comidasPlan.find(
          (comida) =>
            String(
              comida.tipo
            ).toLowerCase() ===
            String(
              tipoComida
            ).toLowerCase()
        );

      if (!comidaPlan) {
        return res.status(400).json({
          mensaje:
            "La comida seleccionada no existe en el plan de hoy.",
        });
      }

      // ============================================
      // 6. OBTENER DATOS DEL PLAN
      // ============================================

      const nombrePlan =
        comidaPlan.nombre;

      const horaPlanificada =
        String(
          comidaPlan.hora
        ).substring(0, 5);

      // ============================================
      // 7. VALIDAR HORA
      // ============================================

      const [horaPlan, minutoPlan] =
        horaPlanificada
          .split(":")
          .map(Number);

      if (
        Number.isNaN(horaPlan) ||
        Number.isNaN(minutoPlan)
      ) {
        return res.status(400).json({
          mensaje:
            "La hora de la comida del plan no es válida.",
        });
      }

      // ============================================
      // 8. OBTENER HORA ACTUAL DEL SERVIDOR
      // ============================================

      const horaActualResult =
        await pool.query(`
          SELECT
            CURRENT_TIME AS hora_actual
        `);

      const horaActualTexto =
        String(
          horaActualResult.rows[0]
            .hora_actual
        ).substring(0, 5);

      const [
        horaActualNum,
        minutoActualNum,
      ] =
        horaActualTexto
          .split(":")
          .map(Number);

      const minutosPlan =
        horaPlan * 60 +
        minutoPlan;

      const minutosActual =
        horaActualNum * 60 +
        minutoActualNum;

      const diferencia =
        minutosActual -
        minutosPlan;

      // ============================================
      // 9. MARGEN DE HORARIO
      // ============================================

      const margenMinutos = 90;

      if (
        Math.abs(
          diferencia
        ) > margenMinutos
      ) {
        return res.status(400).json({
          mensaje:
            `Esta comida no puede registrarse ahora. ` +
            `El ${tipoComida.toLowerCase()} ` +
            `está programado para las ${horaPlanificada}.`,
          horaPlanificada,
          horaActual:
            horaActualTexto,
        });
      }

      // ============================================
      // 10. EVITAR DUPLICADOS
      // ============================================

      const comidaExistente =
        await pool.query(
          `
          SELECT
            id,
            fecha,
            tipo_comida,
            nombre,
            hora,
            completada,
            verificacion_estado
          FROM comidas_registradas
          WHERE usuario_id = $1
            AND fecha = CURRENT_DATE
            AND tipo_comida = $2
          LIMIT 1
          `,
          [
            usuarioId,
            tipoComida,
          ]
        );

      if (
        comidaExistente.rows.length >
        0
      ) {
        return res.status(409).json({
          mensaje:
            "Esta comida ya fue registrada hoy.",
          comida:
            comidaExistente.rows[0],
        });
      }

      // ============================================
      // 11. GUARDAR COMIDA
      // ============================================

      const resultado =
        await pool.query(
          `
          INSERT INTO comidas_registradas
            (
              usuario_id,
              tipo_comida,
              nombre,
              hora,
              foto_url,
              verificacion_estado,
              verificacion_mensaje,
              confianza,
              hora_registro
            )
          VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              'pendiente',
              'La foto está pendiente de verificación mediante IA.',
              NULL,
              CURRENT_TIMESTAMP
            )
          RETURNING
            id,
            fecha,
            tipo_comida,
            nombre,
            hora,
            completada,
            foto_url,
            verificacion_estado,
            verificacion_mensaje,
            confianza,
            hora_registro
          `,
          [
            usuarioId,
            tipoComida,
            nombrePlan,
            horaPlanificada,
            foto,
          ]
        );

      // ============================================
      // 12. RESPUESTA
      // ============================================

      res.status(201).json({
        mensaje:
          "Foto recibida correctamente. La comida quedó pendiente de verificación.",
        comida:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "❌ Error registrando comida:",
        error
      );

      res.status(500).json({
        mensaje:
          "Error registrando la comida.",
        error: error.message,
      });
    }
  }
);

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend ejecutándose en el puerto ${PORT}`);
});