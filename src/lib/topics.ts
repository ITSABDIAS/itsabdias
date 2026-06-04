// Centralized content for /tema/$category/$slug pages.
// Each topic gets explanation, examples, code, tips and a preset prompt for NEXUS.

export type TopicExample = { label: string; lang?: string; code: string };
export type TopicSection = { heading: string; body: string };

export type Topic = {
  category: string;
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  sections: TopicSection[];
  examples?: TopicExample[];
  tips: string[];
  nexusPrompt: string;
};

export const CATEGORY_META: Record<string, { label: string; parentPath: string; accent: string }> = {
  programacion: { label: "Programación", parentPath: "/programacion", accent: "neon-purple" },
  roblox: { label: "Roblox Studio", parentPath: "/roblox", accent: "neon-cyan" },
  hardware: { label: "Hardware & PCs", parentPath: "/hardware", accent: "neon-blue" },
  gamedev: { label: "Desarrollo de Juegos", parentPath: "/gamedev", accent: "neon-purple" },
  electricidad: { label: "Electricidad Básica", parentPath: "/electricidad", accent: "neon-cyan" },
  software: { label: "Software & Ingeniería", parentPath: "/software", accent: "neon-blue" },
  tecnologia: { label: "Tecnología", parentPath: "/tecnologia", accent: "neon-purple" },
};

export const TOPICS: Topic[] = [
  // ==================== PROGRAMACIÓN ====================
  {
    category: "programacion",
    slug: "html",
    title: "HTML — la estructura de la web",
    eyebrow: "// lang.html",
    intro:
      "HTML (HyperText Markup Language) es el esqueleto de cualquier página web. Define qué es cada cosa: títulos, párrafos, imágenes, enlaces y formularios.",
    sections: [
      { heading: "Etiquetas semánticas", body: "Usa <header>, <main>, <section>, <article>, <nav> y <footer>. Mejoran SEO y accesibilidad porque comunican el rol del contenido." },
      { heading: "Formularios", body: "Los <input>, <textarea> y <button> capturan datos del usuario. Siempre asocia <label> con su input vía el atributo for o envolviéndolo." },
      { heading: "Accesibilidad", body: "Usa alt en imágenes, aria-labels en botones sin texto y un único <h1> por página." },
    ],
    examples: [
      {
        label: "Estructura básica",
        lang: "html",
        code: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mi página</title>
  </head>
  <body>
    <header><h1>Hola mundo</h1></header>
    <main>
      <article>
        <p>Bienvenido a mi sitio.</p>
      </article>
    </main>
  </body>
</html>`,
      },
    ],
    tips: [
      "Usa siempre <!DOCTYPE html> al inicio.",
      "Un único <h1> por página, los demás títulos en orden jerárquico.",
      "Alt descriptivo en cada imagen (o alt=\"\" si es decorativa).",
      "Cierra todas las etiquetas, incluso las auto-cerradas en XHTML.",
    ],
    nexusPrompt: "Explícame HTML semántico con un ejemplo práctico de una landing page accesible.",
  },
  {
    category: "programacion",
    slug: "css",
    title: "CSS — diseño y animaciones",
    eyebrow: "// lang.css",
    intro:
      "CSS controla cómo se ven los elementos: colores, espaciado, tipografía, layout y animaciones. Con Flexbox y Grid puedes crear cualquier diseño moderno.",
    sections: [
      { heading: "Flexbox", body: "Ideal para una dimensión: filas o columnas. Usa display: flex; gap; justify-content; align-items." },
      { heading: "Grid", body: "Ideal para layouts bidimensionales. display: grid; grid-template-columns: repeat(3, 1fr); te da una rejilla responsive." },
      { heading: "Variables y temas", body: "Define :root { --primary: #6366f1; } y úsalas con var(--primary). Facilita modo oscuro y temas." },
    ],
    examples: [
      {
        label: "Botón con gradiente y hover",
        lang: "css",
        code: `.btn {
  background: linear-gradient(90deg, #06b6d4, #a855f7);
  color: white;
  padding: .75rem 1.25rem;
  border-radius: .5rem;
  transition: transform .2s ease;
}
.btn:hover { transform: translateY(-2px); }`,
      },
    ],
    tips: [
      "Usa rem/em en vez de px para mejor accesibilidad.",
      "Móvil primero: @media (min-width: 768px) {...}.",
      "Evita !important salvo emergencias.",
      "Aprovecha :has(), :is() y :where() en CSS moderno.",
    ],
    nexusPrompt: "Hazme un layout responsive con CSS Grid de 3 columnas que colapse a 1 en móvil.",
  },
  {
    category: "programacion",
    slug: "javascript",
    title: "JavaScript — el lenguaje de la web",
    eyebrow: "// lang.javascript",
    intro:
      "JavaScript es el lenguaje del navegador y de Node.js. Maneja interactividad, asincronía, APIs, frameworks y todo el ecosistema web moderno.",
    sections: [
      { heading: "Variables y scope", body: "Usa const por defecto, let cuando reasignes, jamás var. Cada {} crea un nuevo scope." },
      { heading: "Async / await", body: "await pausa la ejecución hasta que una Promise resuelve. Más legible que .then() en cadena." },
      { heading: "Módulos ES", body: "import / export entre archivos. Usa export default para exportaciones únicas y named exports para múltiples." },
    ],
    examples: [
      {
        label: "Fetch con async/await y manejo de error",
        lang: "javascript",
        code: `async function getUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error("Error al traer usuario:", err);
    return null;
  }
}`,
      },
    ],
    tips: [
      "Prefiere const a let; let a var; var nunca.",
      "Usa === y !== en vez de == para evitar coerción.",
      "Aprende destructuring, spread y optional chaining (?.).",
      "Aprende Promises antes de pasar a async/await.",
    ],
    nexusPrompt: "Enséñame async/await en JavaScript con ejemplos reales de llamadas a una API.",
  },
  {
    category: "programacion",
    slug: "python",
    title: "Python — versátil y poderoso",
    eyebrow: "// lang.python",
    intro:
      "Python es ideal para scripts, automatización, ciencia de datos, IA y backend. Su sintaxis limpia lo hace perfecto para aprender a programar.",
    sections: [
      { heading: "Tipos y estructuras", body: "list, tuple, dict, set. Aprende list comprehensions: [x*2 for x in nums if x > 0]." },
      { heading: "Funciones y typing", body: "def saludo(nombre: str) -> str: return f\"Hola {nombre}\". Usa type hints para código más mantenible." },
      { heading: "Entornos virtuales", body: "python -m venv .venv y luego source .venv/bin/activate. Aísla dependencias por proyecto." },
    ],
    examples: [
      {
        label: "Script para leer y resumir un CSV",
        lang: "python",
        code: `import csv

with open("ventas.csv") as f:
    reader = csv.DictReader(f)
    total = sum(float(r["monto"]) for r in reader)
    print(f"Total: \${total:,.2f}")`,
      },
    ],
    tips: [
      "Sigue PEP 8 para estilo consistente.",
      "Usa f-strings: f\"Hola {nombre}\".",
      "pip install -r requirements.txt para instalar dependencias.",
      "Para IA usa NumPy, Pandas, PyTorch o scikit-learn.",
    ],
    nexusPrompt: "Dame un script Python que lea un CSV y genere un resumen con Pandas.",
  },
  {
    category: "programacion",
    slug: "lua",
    title: "Lua — ligero y embebido",
    eyebrow: "// lang.lua",
    intro:
      "Lua es un lenguaje minimalista, rápido y embebible. Es el lenguaje oficial de Roblox, Love2D, World of Warcraft y muchos motores de juegos.",
    sections: [
      { heading: "Tablas (todo es una tabla)", body: "Las tablas son arrays, diccionarios y objetos a la vez. Es la única estructura de datos compuesta." },
      { heading: "Funciones de primera clase", body: "Las funciones son valores: puedes pasarlas como argumentos, almacenarlas y retornarlas." },
      { heading: "OOP con metatables", body: "Lua no tiene clases nativas, pero puedes simularlas con metatables y __index." },
    ],
    examples: [
      {
        label: "Clase básica con metatables",
        lang: "lua",
        code: `local Player = {}
Player.__index = Player

function Player.new(name)
  local self = setmetatable({}, Player)
  self.name = name
  self.hp = 100
  return self
end

function Player:damage(amount)
  self.hp = self.hp - amount
end

local p = Player.new("Dev")
p:damage(20)
print(p.name, p.hp) -- Dev 80`,
      },
    ],
    tips: [
      "Los índices comienzan en 1, no en 0.",
      "Usa local siempre que puedas para evitar variables globales.",
      "ipairs() para arrays, pairs() para diccionarios.",
      "string.format() es como printf de C.",
    ],
    nexusPrompt: "Explícame metatables en Lua con un ejemplo de herencia OOP.",
  },
  {
    category: "programacion",
    slug: "react",
    title: "React — UI con componentes",
    eyebrow: "// lang.react",
    intro:
      "React es la librería de UI más usada del mundo. Construyes interfaces con componentes reutilizables que reaccionan a cambios de estado.",
    sections: [
      { heading: "Componentes funcionales", body: "Un componente es una función que retorna JSX. Recibe props y puede tener estado interno con useState." },
      { heading: "Hooks", body: "useState para estado, useEffect para efectos, useMemo/useCallback para optimización, useRef para referencias DOM." },
      { heading: "Estado global", body: "Empieza con Context. Si crece, considera Zustand o TanStack Query para datos del servidor." },
    ],
    examples: [
      {
        label: "Contador con useState",
        lang: "tsx",
        code: `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicks: {count}
    </button>
  );
}`,
      },
    ],
    tips: [
      "Las keys en listas deben ser estables y únicas.",
      "No mutes el estado: usa setState con un nuevo objeto.",
      "useEffect con [] se ejecuta una sola vez al montar.",
      "Divide en componentes pequeños y reutilizables.",
    ],
    nexusPrompt: "Hazme un componente React con TypeScript de una lista de tareas usando useState.",
  },

  // ==================== ROBLOX STUDIO ====================
  {
    category: "roblox",
    slug: "variables",
    title: "Variables en Lua (Roblox)",
    eyebrow: "// roblox.variables",
    intro:
      "Las variables son contenedores de datos. En Roblox Lua, siempre debes declararlas con local salvo que necesites alcance global (poco recomendado).",
    sections: [
      { heading: "Tipos básicos", body: "number, string, boolean, table, nil. Lua infiere el tipo automáticamente." },
      { heading: "Local vs Global", body: "local x = 5 vive solo en su scope. Variables sin local son globales y comparten estado entre scripts." },
      { heading: "Servicios", body: "Guarda los servicios en variables locales: local Players = game:GetService(\"Players\")." },
    ],
    examples: [
      {
        label: "Variables básicas",
        lang: "lua",
        code: `local Players = game:GetService("Players")
local maxHealth = 100
local playerName = "Dev"
local isAlive = true
local inventory = {"espada", "poción"}

print(playerName, maxHealth, isAlive, #inventory)`,
      },
    ],
    tips: [
      "Usa local SIEMPRE para evitar bugs raros.",
      "Nombra variables descriptivamente: playerHealth en vez de h.",
      "Constantes en MAYÚSCULAS: MAX_PLAYERS = 20.",
      "Guarda servicios al inicio del script.",
    ],
    nexusPrompt: "Explícame el alcance de variables en Lua de Roblox con ejemplos.",
  },
  {
    category: "roblox",
    slug: "leaderstats",
    title: "Leaderstats — el ranking del juego",
    eyebrow: "// roblox.leaderstats",
    intro:
      "Leaderstats es una carpeta especial dentro del jugador que Roblox muestra automáticamente en el ranking superior derecho del juego.",
    sections: [
      { heading: "Cómo funciona", body: "Crea una Folder llamada exactamente \"leaderstats\" dentro del Player. Cualquier IntValue o StringValue dentro aparece en el ranking." },
      { heading: "Cuándo crearla", body: "En el evento PlayerAdded del servicio Players, idealmente desde un Script en ServerScriptService." },
    ],
    examples: [
      {
        label: "Leaderstats con monedas y nivel",
        lang: "lua",
        code: `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
  local stats = Instance.new("Folder")
  stats.Name = "leaderstats"
  stats.Parent = player

  local coins = Instance.new("IntValue")
  coins.Name = "Monedas"
  coins.Value = 0
  coins.Parent = stats

  local level = Instance.new("IntValue")
  level.Name = "Nivel"
  level.Value = 1
  level.Parent = stats
end)`,
      },
    ],
    tips: [
      "El nombre DEBE ser \"leaderstats\" en minúsculas.",
      "Usa IntValue para enteros, NumberValue para decimales, StringValue para texto.",
      "Combínalo con DataStore para guardar el progreso.",
      "Pon el script en ServerScriptService.",
    ],
    nexusPrompt: "Dame un sistema de leaderstats en Roblox con monedas guardadas en DataStore.",
  },
  {
    category: "roblox",
    slug: "datastore",
    title: "DataStore — guardado seguro",
    eyebrow: "// roblox.datastore",
    intro:
      "DataStoreService permite guardar datos persistentes de los jugadores entre sesiones. Es crítico para juegos con progresión.",
    sections: [
      { heading: "SetAsync vs UpdateAsync", body: "SetAsync sobreescribe. UpdateAsync lee el valor actual y lo modifica de forma atómica. SIEMPRE prefiere UpdateAsync para evitar pérdidas." },
      { heading: "Retries", body: "Las llamadas pueden fallar por red. Envuélvelas en pcall y reintenta varias veces antes de rendirte." },
      { heading: "PlayerRemoving", body: "Guarda el progreso cuando el jugador se va, no en cada cambio. Reduce llamadas y respeta los rate limits." },
    ],
    examples: [
      {
        label: "Guardado con UpdateAsync y pcall",
        lang: "lua",
        code: `local DataStoreService = game:GetService("DataStoreService")
local SaveStore = DataStoreService:GetDataStore("PlayerSaves_v1")

local function saveData(player, data)
  local success, err = pcall(function()
    SaveStore:UpdateAsync(player.UserId, function() return data end)
  end)
  if not success then warn("Error guardando:", err) end
end

game.Players.PlayerRemoving:Connect(function(player)
  local stats = player:FindFirstChild("leaderstats")
  if stats then
    saveData(player, { coins = stats.Monedas.Value })
  end
end)`,
      },
    ],
    tips: [
      "Cambia el nombre del DataStore al hacer breaking changes: \"PlayerSaves_v2\".",
      "Envuelve TODO en pcall.",
      "Usa BindToClose para guardar antes de que el servidor cierre.",
      "No guardes en cada cambio: hazlo periódicamente o al salir.",
    ],
    nexusPrompt: "Dame un sistema completo de guardado con DataStore, retries y BindToClose en Roblox.",
  },
  {
    category: "roblox",
    slug: "remoteevents",
    title: "RemoteEvents — cliente y servidor",
    eyebrow: "// roblox.remoteevents",
    intro:
      "Los RemoteEvents permiten comunicación entre LocalScripts (cliente) y Scripts (servidor). Son la base de cualquier interacción segura en Roblox.",
    sections: [
      { heading: "Dirección de envío", body: "Cliente → Servidor: FireServer(). Servidor → Cliente: FireClient(player). Servidor → Todos: FireAllClients()." },
      { heading: "Seguridad", body: "JAMÁS confíes en el cliente. Valida TODO en el servidor: distancia, cooldowns, propiedad de items, permisos." },
      { heading: "RemoteFunctions", body: "Como RemoteEvents pero esperan respuesta. Útil para pedir datos al servidor desde el cliente." },
    ],
    examples: [
      {
        label: "Sistema de disparo con validación",
        lang: "lua",
        code: `-- ReplicatedStorage/Shoot (RemoteEvent)
-- Server Script:
local Shoot = game.ReplicatedStorage:WaitForChild("Shoot")
local cooldowns = {}

Shoot.OnServerEvent:Connect(function(player, target)
  local now = tick()
  if cooldowns[player] and now - cooldowns[player] < 0.5 then return end
  cooldowns[player] = now

  if typeof(target) ~= "Vector3" then return end
  -- Procesar el disparo
  print(player.Name, "disparó a", target)
end)`,
      },
    ],
    tips: [
      "Servidor valida TODO. El cliente puede mentir.",
      "Usa typeof() para verificar argumentos.",
      "Implementa rate limiting (cooldowns) en el servidor.",
      "Pon los RemoteEvents en ReplicatedStorage.",
    ],
    nexusPrompt: "Hazme un RemoteEvent seguro en Roblox con validación anti-exploit completa.",
  },
  {
    category: "roblox",
    slug: "ui",
    title: "Interfaces UI en Roblox",
    eyebrow: "// roblox.ui",
    intro:
      "Las interfaces se construyen con ScreenGui, Frame, TextLabel, ImageLabel y TextButton. Usa TweenService para animaciones suaves.",
    sections: [
      { heading: "Estructura básica", body: "ScreenGui (raíz) → Frame (contenedor) → elementos. Pon los ScreenGui en StarterGui para que se repliquen a cada jugador." },
      { heading: "UI responsive", body: "Usa UIScale + AspectRatioConstraint, escalas relativas (Scale en vez de Offset) y AnchorPoint para centrado real." },
      { heading: "TweenService", body: "Anima propiedades como Position, Size o Transparency con curvas EasingStyle predefinidas." },
    ],
    examples: [
      {
        label: "Animar la apertura de un menú",
        lang: "lua",
        code: `local TweenService = game:GetService("TweenService")
local frame = script.Parent

local goal = { Position = UDim2.new(0.5, 0, 0.5, 0) }
local info = TweenInfo.new(0.5, Enum.EasingStyle.Quart, Enum.EasingDirection.Out)

TweenService:Create(frame, info, goal):Play()`,
      },
    ],
    tips: [
      "AnchorPoint = Vector2.new(0.5, 0.5) centra el elemento sobre su posición.",
      "Usa UIListLayout y UIGridLayout para layouts automáticos.",
      "ZIndex controla qué se ve encima.",
      "Prueba en distintas resoluciones (móvil, tablet, PC).",
    ],
    nexusPrompt: "Dame un menú principal animado en Roblox con TweenService.",
  },
  {
    category: "roblox",
    slug: "gamepasses",
    title: "Gamepasses y monetización",
    eyebrow: "// roblox.gamepasses",
    intro:
      "Los Gamepasses son compras únicas que dan beneficios permanentes. Los Developer Products son compras consumibles (monedas, etc).",
    sections: [
      { heading: "Crear el pase", body: "Sube tu Gamepass en la página del juego en Roblox.com, anota su ID numérico." },
      { heading: "Verificar propiedad", body: "Usa MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId) en el servidor." },
      { heading: "Prompts de compra", body: "PromptGamePassPurchase para Gamepasses, PromptProductPurchase para Developer Products." },
    ],
    examples: [
      {
        label: "Dar beneficio si el jugador tiene el pase",
        lang: "lua",
        code: `local MarketplaceService = game:GetService("MarketplaceService")
local PASS_ID = 12345678

game.Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(char)
    local ok, owns = pcall(function()
      return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)
    if ok and owns then
      char:WaitForChild("Humanoid").WalkSpeed = 32
    end
  end)
end)`,
      },
    ],
    tips: [
      "Verifica en cada respawn, no solo al entrar.",
      "Envuelve UserOwnsGamePassAsync en pcall siempre.",
      "Usa PromptGamePassPurchaseFinished para reaccionar a compras en vivo.",
      "No regales beneficios desbalanceados, mantén el juego justo F2P.",
    ],
    nexusPrompt: "Cómo implementar un Gamepass de VIP en Roblox con beneficios y verificación segura.",
  },
  {
    category: "roblox",
    slug: "sistemas",
    title: "Sistemas completos",
    eyebrow: "// roblox.systems",
    intro:
      "Construir un juego es ensamblar sistemas: inventario, combate, misiones, economía, progresión. Cada uno modular y testeable.",
    sections: [
      { heading: "Inventario", body: "Una tabla de items por jugador. Funciones agregar, quitar, usar. Replica al cliente solo lo necesario." },
      { heading: "Combate", body: "Servidor calcula daño. Cliente solo muestra efectos visuales (hit markers, partículas)." },
      { heading: "Economía", body: "Define drenajes (compras, muertes) y fuentes (recompensas, misiones). Sin drenaje, hay inflación." },
    ],
    examples: [
      {
        label: "Módulo de inventario",
        lang: "lua",
        code: `local Inventory = {}
Inventory.__index = Inventory

function Inventory.new()
  return setmetatable({ items = {} }, Inventory)
end

function Inventory:add(item, qty)
  self.items[item] = (self.items[item] or 0) + (qty or 1)
end

function Inventory:remove(item, qty)
  local current = self.items[item] or 0
  if current < qty then return false end
  self.items[item] = current - qty
  return true
end

return Inventory`,
      },
    ],
    tips: [
      "Divide cada sistema en su propio ModuleScript.",
      "Pon la lógica del servidor en ServerScriptService.",
      "Replica solo lo visible al cliente.",
      "Documenta funciones públicas con comentarios.",
    ],
    nexusPrompt: "Hazme un sistema de inventario completo en Roblox con guardado y UI.",
  },

  // ==================== HARDWARE ====================
  {
    category: "hardware",
    slug: "cpu",
    title: "CPU — el cerebro del PC",
    eyebrow: "// hw.cpu",
    intro:
      "La CPU (procesador) ejecuta todas las instrucciones de tu software. Más núcleos = mejor multitarea; mayor frecuencia = mejor rendimiento por hilo.",
    sections: [
      { heading: "Núcleos e hilos", body: "Núcleos son unidades físicas. Hilos (con SMT/HT) duplican el rendimiento en cargas paralelas. Para gaming priorizan frecuencia, para creación priorizan núcleos." },
      { heading: "Marcas y arquitecturas", body: "Intel (Core Ultra, Core i3/5/7/9) y AMD (Ryzen 3/5/7/9). AMD lidera en eficiencia con cache 3D; Intel en monohilo bruto." },
      { heading: "Socket y compatibilidad", body: "Cada CPU usa un socket específico (AM5, LGA1700, LGA1851). La motherboard debe coincidir." },
    ],
    tips: [
      "Para gaming puro: Ryzen 7 X3D o Intel Core Ultra 7.",
      "Para edición/render: prioriza núcleos (Ryzen 9 o i9).",
      "TDP alto = más cooler. No subestimes la refrigeración.",
      "Activa XMP/EXPO para que la RAM corra a su velocidad real.",
    ],
    nexusPrompt: "Ayúdame a elegir CPU para gaming 1440p con presupuesto medio.",
    sections: [],
  } as Topic,
  {
    category: "hardware",
    slug: "gpu",
    title: "GPU — gráficos y IA",
    eyebrow: "// hw.gpu",
    intro:
      "La GPU procesa gráficos en paralelo. Hoy también es clave para IA local, renderizado 3D, edición de vídeo y minería de datos.",
    sections: [
      { heading: "VRAM importa", body: "Para 1440p moderno: 12 GB mínimo. Para 4K o IA local: 16 GB+. La VRAM insuficiente provoca caídas brutales de FPS." },
      { heading: "DLSS / FSR / XeSS", body: "Tecnologías de upscaling que renderizan a menor resolución y reconstruyen. Pueden duplicar FPS sin perder calidad visible." },
      { heading: "Ray Tracing", body: "Iluminación realista pero costosa. Las RTX y RX modernas lo soportan, pero a veces conviene desactivarlo." },
    ],
    tips: [
      "Compara FPS reales en YouTube, no solo specs.",
      "Una fuente débil mata GPUs potentes; revisa el consumo (TGP).",
      "Para 1080p basta una xx60; para 4K, una xx80 o superior.",
      "Drivers actualizados pueden dar +15% en juegos nuevos.",
    ],
    nexusPrompt: "Cuál es la mejor GPU calidad/precio actual para jugar a 1440p con ray tracing.",
    sections: [],
  } as Topic,
  {
    category: "hardware",
    slug: "ram",
    title: "RAM — memoria de trabajo",
    eyebrow: "// hw.ram",
    intro:
      "La RAM almacena lo que el sistema usa en este momento. A más capacidad y velocidad, más fluidez al multitarea y mejor rendimiento general.",
    sections: [
      { heading: "DDR4 vs DDR5", body: "DDR5 es más rápida y eficiente, pero requiere motherboard compatible. DDR4 sigue siendo válida en builds económicas." },
      { heading: "Velocidad y latencia", body: "MHz altos no compensan si la latencia (CL) es muy alta. Busca buen equilibrio: DDR5-6000 CL30 es referencia para Ryzen 7000." },
      { heading: "Dual channel", body: "Siempre 2 módulos iguales (2x16 GB en vez de 1x32). Duplica el ancho de banda." },
    ],
    tips: [
      "16 GB mínimo, 32 GB para creación o juegos modernos.",
      "Activa XMP (Intel) o EXPO (AMD) en BIOS.",
      "Compra kits, no módulos sueltos.",
      "Evita mezclar marcas/velocidades.",
    ],
    nexusPrompt: "Qué RAM comprar para Ryzen 7 7800X3D para gaming y streaming.",
    sections: [],
  } as Topic,
  {
    category: "hardware",
    slug: "ssd",
    title: "SSD — almacenamiento veloz",
    eyebrow: "// hw.ssd",
    intro:
      "Un SSD reduce drásticamente los tiempos de carga del sistema, los juegos y las aplicaciones. Los NVMe son hasta 10x más rápidos que SATA.",
    sections: [
      { heading: "SATA vs NVMe", body: "SATA SSDs llegan a ~550 MB/s. NVMe Gen3 ~3500, Gen4 ~7000, Gen5 ~12000+. Gen4 es el sweet spot precio/rendimiento." },
      { heading: "DRAM cache", body: "SSDs con DRAM mantienen rendimiento bajo carga sostenida. Los DRAM-less son baratos pero se ralentizan." },
      { heading: "TBW", body: "Total Bytes Written: la resistencia del SSD. Para uso normal cualquier SSD moderno te durará una década." },
    ],
    tips: [
      "Sistema operativo siempre en NVMe.",
      "1 TB mínimo recomendado en 2026.",
      "Habilita TRIM (Windows lo hace por defecto).",
      "Para PS5 necesitas NVMe Gen4 con disipador.",
    ],
    nexusPrompt: "Recomiéndame un SSD NVMe Gen4 de 2TB con buen TBW para gaming.",
    sections: [],
  } as Topic,

  // ==================== GAMEDEV ====================
  {
    category: "gamedev",
    slug: "unity",
    title: "Unity — el motor más usado",
    eyebrow: "// gd.unity",
    intro:
      "Unity es el motor más popular del mundo indie. Usa C#, soporta 2D y 3D, y publica en PC, consolas, móvil, web y VR.",
    sections: [
      { heading: "MonoBehaviour", body: "La base de los scripts. Métodos clave: Start (inicio), Update (cada frame), FixedUpdate (física)." },
      { heading: "Prefabs", body: "Plantillas reutilizables de GameObjects. Cambias el prefab y todas las instancias se actualizan." },
      { heading: "Asset Store", body: "Catálogo enorme de assets, plugins y herramientas. Empieza ahí antes de reinventar la rueda." },
    ],
    examples: [
      {
        label: "Script de movimiento básico",
        lang: "csharp",
        code: `using UnityEngine;

public class PlayerMove : MonoBehaviour {
    public float speed = 5f;
    void Update() {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);
    }
}`,
      },
    ],
    tips: [
      "Usa Time.deltaTime para movimiento independiente de FPS.",
      "Prefabs > duplicar GameObjects.",
      "Profiler antes de optimizar a ciegas.",
      "Aprende Cinemachine para cámaras profesionales.",
    ],
    nexusPrompt: "Enséñame Unity con un primer juego 2D paso a paso.",
  },
  {
    category: "gamedev",
    slug: "unreal",
    title: "Unreal Engine — calidad AAA",
    eyebrow: "// gd.unreal",
    intro:
      "Unreal Engine es el motor detrás de juegos AAA como Fortnite. Usa C++ y Blueprints (programación visual), con gráficos espectaculares listos para producción.",
    sections: [
      { heading: "Blueprints vs C++", body: "Blueprints permiten prototipar rápido sin código. C++ da máximo rendimiento. Lo común es mezclar ambos." },
      { heading: "Lumen y Nanite", body: "Lumen es iluminación global dinámica en tiempo real. Nanite renderiza geometría virtualizada con detalle infinito." },
      { heading: "Niagara", body: "Sistema de partículas avanzado para efectos visuales: fuego, explosiones, humo, magia." },
    ],
    tips: [
      "Empieza con Blueprints; pasa a C++ cuando lo necesites.",
      "Lumen + Nanite requieren GPU moderna.",
      "Royalties: 5% sobre ingresos arriba de $1M.",
      "Documentación oficial es excelente.",
    ],
    nexusPrompt: "Cómo empezar con Unreal Engine 5 y Blueprints siendo principiante.",
    sections: [],
  } as Topic,
  {
    category: "gamedev",
    slug: "godot",
    title: "Godot — open source y ligero",
    eyebrow: "// gd.godot",
    intro:
      "Godot es gratuito, open source y muy ligero (~100 MB). Usa GDScript (similar a Python), C# o C++. Ideal para indies y 2D.",
    sections: [
      { heading: "Nodos y escenas", body: "Todo es un nodo. Las escenas son árboles de nodos reutilizables. Combinables como prefabs." },
      { heading: "GDScript", body: "Lenguaje propio con sintaxis tipo Python. Integración perfecta con el editor y el motor." },
      { heading: "2D first-class", body: "Godot tiene uno de los mejores motores 2D del mercado, sin necesidad de hacks ni plugins." },
    ],
    examples: [
      {
        label: "Movimiento 2D en GDScript",
        lang: "gdscript",
        code: `extends CharacterBody2D

@export var speed := 200.0

func _physics_process(delta):
    var dir := Input.get_vector("left", "right", "up", "down")
    velocity = dir * speed
    move_and_slide()`,
      },
    ],
    tips: [
      "Cero royalties, gratis para siempre.",
      "Ideal para 2D, capaz en 3D.",
      "Documentación oficial muy completa.",
      "Comunidad creciente y activa.",
    ],
    nexusPrompt: "Crea conmigo un platformer 2D en Godot desde cero.",
  },
  {
    category: "gamedev",
    slug: "niveles",
    title: "Diseño de niveles",
    eyebrow: "// gd.leveldesign",
    intro:
      "El diseño de niveles determina cómo se siente el juego. Pacing, dificultad, exploración y narrativa ambiental se cruzan aquí.",
    sections: [
      { heading: "Pacing", body: "Alterna momentos de tensión con descanso. Si todo es intenso, el jugador se agota. Si todo es calmado, se aburre." },
      { heading: "Onboarding", body: "Enseña mecánicas en niveles seguros antes de exigirlas. \"Show, don't tell\"." },
      { heading: "Foreshadowing visual", body: "Usa luz, color y composición para guiar la mirada del jugador hacia el objetivo." },
    ],
    tips: [
      "Greybox primero: prueba layout con cubos antes de arte final.",
      "Playtest TEMPRANO con gente que no sea el dev.",
      "Marca el camino principal con iluminación y landmarks.",
      "Recompensa la exploración con secretos opcionales.",
    ],
    nexusPrompt: "Dame principios de diseño de niveles para un Metroidvania 2D.",
    sections: [],
  } as Topic,
  {
    category: "gamedev",
    slug: "ia",
    title: "IA para videojuegos",
    eyebrow: "// gd.gameai",
    intro:
      "La IA en juegos no es deep learning: es comportamiento creíble. FSM, behavior trees, pathfinding y, cada vez más, LLMs para NPCs.",
    sections: [
      { heading: "FSM (máquinas de estado)", body: "Simples y predecibles: Idle → Patrol → Chase → Attack. Ideal para enemigos básicos." },
      { heading: "Behavior trees", body: "Estructuran decisiones complejas en árboles con secuencias, selectores y decoradores. Estándar en juegos AAA." },
      { heading: "Pathfinding", body: "A* sobre navmesh es el algoritmo dominante. Unity, Unreal y Godot tienen sistemas integrados." },
    ],
    tips: [
      "Empieza con FSM, sube a behavior trees al crecer.",
      "Telegrafía las acciones del enemigo para que sea justo.",
      "Una IA \"tonta pero divertida\" gana a una IA \"perfecta pero frustrante\".",
      "Para NPCs con LLMs, limita el contexto y filtra outputs.",
    ],
    nexusPrompt: "Cómo implementar un behavior tree básico para un enemigo en Unity.",
    sections: [],
  } as Topic,
  {
    category: "gamedev",
    slug: "arte",
    title: "Arte 2D y 3D",
    eyebrow: "// gd.art",
    intro:
      "Sin arte no hay juego. Pixel art, vector, hand-drawn, low-poly, PBR: cada estilo tiene sus herramientas y su público.",
    sections: [
      { heading: "Herramientas 2D", body: "Aseprite (pixel art), Krita (digital painting), Adobe Animate (2D animado), Photoshop, Figma." },
      { heading: "Herramientas 3D", body: "Blender (gratis, líder), Maya y 3ds Max (industria AAA), ZBrush (sculpting), Substance Painter (texturizado PBR)." },
      { heading: "Estilo consistente", body: "Un estilo coherente y limitado vale más que arte fotorrealista mal ejecutado. Define una paleta y respétala." },
    ],
    tips: [
      "Blender es gratis y de nivel profesional.",
      "Estudia anatomía y color, no solo software.",
      "Reutiliza assets con variaciones de color.",
      "La animación vende más que el modelo estático.",
    ],
    nexusPrompt: "Recomiéndame un workflow para hacer pixel art para un juego indie.",
    sections: [],
  } as Topic,

  // ==================== ELECTRICIDAD ====================
  {
    category: "electricidad",
    slug: "circuitos",
    title: "Circuitos eléctricos",
    eyebrow: "// elec.circuits",
    intro:
      "Un circuito es un camino cerrado por donde fluye corriente. Los elementos básicos son fuente, conductores, resistencias y carga.",
    sections: [
      { heading: "Serie vs paralelo", body: "En serie la corriente es igual y la tensión se reparte. En paralelo la tensión es igual y la corriente se reparte." },
      { heading: "Ley de Ohm", body: "V = I × R. Voltaje (V) es presión, corriente (I) es flujo, resistencia (R) es oposición." },
      { heading: "Kirchhoff", body: "Ley de corrientes: suma de corrientes en un nodo = 0. Ley de tensiones: suma de tensiones en un lazo cerrado = 0." },
    ],
    examples: [
      {
        label: "Cálculo con Ley de Ohm",
        lang: "text",
        code: `Si V = 12 V y R = 220 Ω:
I = V / R = 12 / 220 = 0.0545 A = 54.5 mA

Potencia disipada: P = V × I = 12 × 0.0545 = 0.654 W`,
      },
    ],
    tips: [
      "Siempre desconecta antes de manipular.",
      "Usa multímetro para verificar valores reales.",
      "Calcula la potencia, no solo la corriente: P = V·I.",
      "Respeta la polaridad en componentes polarizados.",
    ],
    nexusPrompt: "Explícame circuitos en serie y paralelo con un ejemplo numérico.",
  },
  {
    category: "electricidad",
    slug: "voltaje",
    title: "Voltaje (tensión)",
    eyebrow: "// elec.voltage",
    intro:
      "El voltaje es la diferencia de potencial eléctrico entre dos puntos. Es la \"presión\" que empuja a los electrones a moverse.",
    sections: [
      { heading: "AC vs DC", body: "DC (corriente continua) tiene polaridad fija: baterías, USB, microcontroladores. AC (alterna) cambia polaridad 50/60 veces por segundo: enchufes de pared." },
      { heading: "Niveles comunes", body: "1.5V pila AA, 3.3V/5V lógica digital, 12V automoción, 110-240V red doméstica." },
      { heading: "Medir voltaje", body: "Con multímetro en modo V (DC o AC). Conecta en paralelo al elemento que mides." },
    ],
    tips: [
      "Nunca midas voltaje en serie: cortocircuito.",
      "Más voltaje no significa más \"fuerza\" útil: importa también la corriente.",
      "Cuidado con AC: 50V puede ser mortal en condiciones adversas.",
      "Reguladores LDO o switching estabilizan el voltaje de alimentación.",
    ],
    nexusPrompt: "Diferencias entre voltaje AC y DC y cuándo se usa cada uno.",
    sections: [],
  } as Topic,
  {
    category: "electricidad",
    slug: "corriente",
    title: "Corriente eléctrica",
    eyebrow: "// elec.current",
    intro:
      "La corriente es el flujo de electrones por un conductor, medida en amperios (A). Es lo que realmente \"hace trabajo\" en un circuito.",
    sections: [
      { heading: "Resistencia limita corriente", body: "Sin resistencia adecuada, un componente puede recibir demasiada corriente y quemarse. Por eso los LEDs llevan resistencia limitadora." },
      { heading: "Potencia", body: "P (vatios) = V × I. Una carga de 12V con 2A consume 24W." },
      { heading: "Fusibles", body: "Cortan el circuito si la corriente supera un umbral seguro. Protegen contra cortocircuitos." },
    ],
    examples: [
      {
        label: "Resistencia para un LED",
        lang: "text",
        code: `LED rojo típico: 2V, 20mA = 0.020A
Fuente: 5V
R = (5 - 2) / 0.020 = 150 Ω
Usa una resistencia de 220Ω por seguridad.`,
      },
    ],
    tips: [
      "Mide la corriente en serie con el circuito, no en paralelo.",
      "Para mA usa la escala mA del multímetro; para A grandes, el shunt de 10A.",
      "Calcula primero la corriente de cada componente antes de conectarlo.",
      "Cortocircuito = corriente infinita = humo. Siempre fusible.",
    ],
    nexusPrompt: "Cómo calcular la resistencia limitadora para un LED a 5V.",
  },
  {
    category: "electricidad",
    slug: "sensores",
    title: "Sensores",
    eyebrow: "// elec.sensors",
    intro:
      "Los sensores convierten magnitudes físicas (luz, temperatura, presión, movimiento) en señales eléctricas que un microcontrolador puede leer.",
    sections: [
      { heading: "Analógicos vs digitales", body: "Analógicos dan un voltaje variable (LDR, NTC). Digitales entregan 0/1 o protocolos como I2C/SPI (DHT22, BME280)." },
      { heading: "Lectura con Arduino", body: "analogRead() para analógicos (0-1023). digitalRead() para digitales (HIGH/LOW). Sensores I2C usan librerías." },
      { heading: "Acondicionamiento", body: "Algunos sensores necesitan divisor de tensión, amplificación o filtrado antes de leerse correctamente." },
    ],
    examples: [
      {
        label: "Leer LDR en Arduino",
        lang: "cpp",
        code: `void setup() { Serial.begin(9600); }
void loop() {
  int luz = analogRead(A0); // 0-1023
  Serial.println(luz);
  delay(200);
}`,
      },
    ],
    tips: [
      "Lee el datasheet del sensor: voltaje, rango, protocolo.",
      "Usa pull-up o pull-down según necesite la entrada digital.",
      "Calibra los sensores en condiciones reales.",
      "Promedia varias lecturas para reducir ruido.",
    ],
    nexusPrompt: "Cómo conectar y leer un sensor DHT22 de temperatura y humedad con Arduino.",
  },
  {
    category: "electricidad",
    slug: "arduino",
    title: "Arduino — microcontrolador para todos",
    eyebrow: "// elec.arduino",
    intro:
      "Arduino es la plataforma de prototipado más popular del mundo. Combina hardware accesible con software libre (Arduino IDE) y librerías para casi todo.",
    sections: [
      { heading: "Placas", body: "Uno (clásica, 5V), Nano (compacta), Mega (más pines), Leonardo (USB HID nativo), ESP32 (WiFi/BT integrado, más potente)." },
      { heading: "Estructura del código", body: "setup() corre una vez. loop() corre eternamente. Usa #include para librerías." },
      { heading: "Comunicación", body: "Serial.print() para depurar. I2C (Wire.h), SPI, UART y WiFi (en ESP32) para comunicar con otros chips o internet." },
    ],
    examples: [
      {
        label: "Parpadear un LED",
        lang: "cpp",
        code: `void setup() { pinMode(13, OUTPUT); }
void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`,
      },
    ],
    tips: [
      "Empieza con un Arduino Uno o ESP32.",
      "ESP32 es mejor que Uno casi siempre (más rápido, WiFi, BT).",
      "Usa una protoboard antes de soldar.",
      "Comparte 5V/3.3V según necesite cada componente.",
    ],
    nexusPrompt: "Hazme un proyecto Arduino que encienda un LED cuando hay poca luz.",
  },
  {
    category: "electricidad",
    slug: "diy",
    title: "Proyectos DIY",
    eyebrow: "// elec.diy",
    intro:
      "Hacer proyectos reales es la mejor forma de aprender electrónica. Empieza pequeño y ve subiendo complejidad.",
    sections: [
      { heading: "Ideas para empezar", body: "Semáforo con LEDs, alarma con sensor de movimiento, termómetro digital, robot seguidor de línea, regador automático de plantas." },
      { heading: "Domótica", body: "Con ESP32 + Home Assistant controla luces, ventiladores, persianas y sensores desde el móvil." },
      { heading: "Robótica", body: "Motores DC + driver L298N, servomotores, ruedas, batería LiPo. Aprende cinemática diferencial." },
    ],
    tips: [
      "Documenta tus proyectos (foto + esquema + código).",
      "Compra módulos integrados al principio.",
      "Usa cajas o estuches para tus proyectos terminados.",
      "Comparte en redes; te motiva y te enseña.",
    ],
    nexusPrompt: "Dame 5 proyectos DIY con Arduino para nivel principiante con materiales económicos.",
    sections: [],
  } as Topic,

  // ==================== SOFTWARE ====================
  {
    category: "software",
    slug: "apis",
    title: "APIs — interfaces entre sistemas",
    eyebrow: "// sw.apis",
    intro:
      "Una API es un contrato que permite que dos sistemas hablen entre sí. REST y GraphQL son los dos estilos dominantes hoy.",
    sections: [
      { heading: "REST", body: "Usa HTTP (GET, POST, PUT, DELETE) y recursos (/users, /users/123). Sencillo, cacheable, ampliamente soportado." },
      { heading: "GraphQL", body: "Una sola URL, el cliente pide exactamente los campos que necesita. Reduce over/under-fetching." },
      { heading: "Autenticación", body: "JWT, OAuth 2.0 y API keys son lo común. Siempre HTTPS, nunca tokens en URL." },
    ],
    examples: [
      {
        label: "Fetch a una REST API",
        lang: "javascript",
        code: `const res = await fetch("https://api.example.com/users/1", {
  headers: { Authorization: \`Bearer \${token}\` },
});
const user = await res.json();`,
      },
    ],
    tips: [
      "Versiona tus APIs: /api/v1/users.",
      "Documenta con OpenAPI/Swagger.",
      "Rate limiting obligatorio en endpoints públicos.",
      "Devuelve códigos HTTP correctos (200, 201, 400, 401, 404, 500).",
    ],
    nexusPrompt: "Explícame REST vs GraphQL con ejemplos prácticos.",
  },
  {
    category: "software",
    slug: "bases-de-datos",
    title: "Bases de datos",
    eyebrow: "// sw.databases",
    intro:
      "Las bases de datos almacenan y consultan información. SQL (relacionales) y NoSQL (clave-valor, documentos, grafos) cubren distintas necesidades.",
    sections: [
      { heading: "SQL", body: "PostgreSQL, MySQL, SQLite. Tablas con relaciones, transacciones ACID, lenguaje SQL universal." },
      { heading: "NoSQL", body: "MongoDB (documentos), Redis (clave-valor), Cassandra (columnar). Escalables horizontalmente." },
      { heading: "Índices", body: "Aceleran consultas pero ralentizan escrituras. Indexa columnas que aparecen en WHERE o JOIN." },
    ],
    examples: [
      {
        label: "Query SQL con JOIN",
        lang: "sql",
        code: `SELECT u.name, COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id
ORDER BY post_count DESC
LIMIT 10;`,
      },
    ],
    tips: [
      "Empieza con SQL salvo que tengas razón clara para NoSQL.",
      "EXPLAIN ANALYZE para entender por qué una query es lenta.",
      "Backups regulares y restauración probada.",
      "Usa migraciones versionadas (Prisma, Drizzle, Flyway).",
    ],
    nexusPrompt: "Cuándo conviene PostgreSQL y cuándo MongoDB.",
  },
  {
    category: "software",
    slug: "backend",
    title: "Backend",
    eyebrow: "// sw.backend",
    intro:
      "El backend es el servidor: maneja datos, lógica, autenticación y comunicación con la base de datos. Lo que no se ve, pero hace todo posible.",
    sections: [
      { heading: "Lenguajes y frameworks", body: "Node.js (Express, NestJS, Hono), Python (FastAPI, Django), Go (estándar), Rust (Axum), Java (Spring)." },
      { heading: "Autenticación", body: "Sesiones con cookies HTTP-only o JWT. Siempre HTTPS, contraseñas hasheadas con bcrypt/argon2." },
      { heading: "Patrones", body: "MVC, layered architecture, hexagonal. Separa rutas, servicios y acceso a datos." },
    ],
    tips: [
      "Valida TODO input del usuario.",
      "Nunca expongas stack traces en producción.",
      "Logs estructurados (JSON) facilitan debug.",
      "Health checks y métricas desde el día 1.",
    ],
    nexusPrompt: "Diferencias entre Express, NestJS y Hono para hacer un backend en Node.",
    sections: [],
  } as Topic,
  {
    category: "software",
    slug: "frontend",
    title: "Frontend",
    eyebrow: "// sw.frontend",
    intro:
      "El frontend es lo que el usuario ve y toca. UI, UX, performance y accesibilidad se cruzan aquí.",
    sections: [
      { heading: "Frameworks dominantes", body: "React (con Next.js, Remix, TanStack Start), Vue, Svelte, Solid. React lidera el mercado." },
      { heading: "Estado", body: "Local (useState), Context para temas/usuario, TanStack Query para datos del servidor, Zustand/Jotai si necesitas estado global complejo." },
      { heading: "Performance", body: "Lazy load imágenes, code splitting, evita re-renders innecesarios. Mide con Lighthouse." },
    ],
    tips: [
      "Mobile-first siempre.",
      "Accesibilidad no es opcional (aria-*, contraste, focus).",
      "Mantén bundles bajo 200KB iniciales si puedes.",
      "Usa TypeScript desde el principio.",
    ],
    nexusPrompt: "Mejores prácticas para optimizar performance de una app React.",
    sections: [],
  } as Topic,
  {
    category: "software",
    slug: "devops",
    title: "DevOps & CI/CD",
    eyebrow: "// sw.devops",
    intro:
      "DevOps une desarrollo y operaciones. CI/CD automatiza tests, builds y despliegues para entregar software más rápido y seguro.",
    sections: [
      { heading: "CI/CD", body: "GitHub Actions, GitLab CI, CircleCI. Cada push corre tests y, si pasan, despliega." },
      { heading: "Contenedores", body: "Docker empaqueta tu app con sus dependencias. Kubernetes orquesta contenedores a escala." },
      { heading: "Observabilidad", body: "Logs (Loki), métricas (Prometheus), traces (OpenTelemetry). Si no lo mides, no lo arreglas." },
    ],
    tips: [
      "Pipelines como código, versionadas en el repo.",
      "Rollback rápido > deploy perfecto.",
      "Feature flags para desplegar sin liberar.",
      "Secrets en vaults (no en .env del repo).",
    ],
    nexusPrompt: "Hazme un workflow básico de GitHub Actions para una app Node con tests y deploy.",
    sections: [],
  } as Topic,
  {
    category: "software",
    slug: "arquitectura",
    title: "Arquitectura de software",
    eyebrow: "// sw.architecture",
    intro:
      "La arquitectura es cómo organizas tu sistema. Buenas decisiones temprano ahorran años de refactor doloroso.",
    sections: [
      { heading: "Monolito vs microservicios", body: "Empieza con monolito modular. Solo divide en microservicios si tienes equipo y operación para soportarlos." },
      { heading: "Patrones útiles", body: "Hexagonal, Clean Architecture, DDD (cuando el dominio es complejo), CQRS para lectura/escritura asimétrica." },
      { heading: "Decisiones documentadas", body: "ADRs (Architecture Decision Records) registran el porqué de cada decisión grande." },
    ],
    tips: [
      "Optimiza para cambio, no para predecir el futuro.",
      "Premature optimization is the root of all evil — Knuth.",
      "Lee \"A Philosophy of Software Design\".",
      "Diagramas C4 para comunicar a no-técnicos.",
    ],
    nexusPrompt: "Cuándo migrar de monolito a microservicios y cómo hacerlo.",
    sections: [],
  } as Topic,
  {
    category: "software",
    slug: "distribuidos",
    title: "Sistemas distribuidos",
    eyebrow: "// sw.distributed",
    intro:
      "Cuando una sola máquina no basta, distribuyes carga entre muchas. Pero entras al mundo de fallos parciales, latencia y consistencia.",
    sections: [
      { heading: "Teorema CAP", body: "En presencia de partición de red eliges entre Consistencia y Disponibilidad. No puedes tener las tres siempre." },
      { heading: "Mensajería", body: "Kafka, RabbitMQ, NATS desacoplan productores de consumidores. Permiten escalar y tolerar fallos." },
      { heading: "Idempotencia", body: "Si un mensaje se reintenta, el resultado debe ser el mismo. Diseña operaciones idempotentes desde el principio." },
    ],
    tips: [
      "Asume que TODO falla: red, disco, proceso.",
      "Reintentos con backoff exponencial.",
      "Circuit breakers para no propagar caídas.",
      "Lee el paper de Dynamo de Amazon.",
    ],
    nexusPrompt: "Explícame el teorema CAP con un ejemplo real.",
    sections: [],
  } as Topic,

  // ==================== TECNOLOGÍA ====================
  {
    category: "tecnologia",
    slug: "ia",
    title: "Inteligencia Artificial",
    eyebrow: "// tech.ai",
    intro:
      "La IA generativa está reescribiendo cómo trabajamos, creamos y aprendemos. Modelos como GPT, Gemini y Claude redefinen lo posible cada mes.",
    sections: [
      { heading: "LLMs", body: "Large Language Models entrenados con billones de tokens. Convirtieron el chat en interfaz universal." },
      { heading: "Agentes", body: "LLMs que ejecutan acciones: buscar, escribir código, mover archivos. Son el siguiente salto de la IA." },
      { heading: "IA local", body: "Modelos abiertos (Llama, Mistral, Qwen) corren en tu PC con Ollama o LM Studio. Privacidad total." },
    ],
    tips: [
      "Aprende prompt engineering: contexto + ejemplo + restricciones.",
      "No confíes ciegamente: verifica datos críticos.",
      "Usa IA para acelerarte, no para reemplazar tu pensamiento.",
      "Pregunta a NEXUS para temas específicos de IA.",
    ],
    nexusPrompt: "Cuáles son los modelos de IA más capaces hoy y para qué usar cada uno.",
    sections: [],
  } as Topic,
  {
    category: "tecnologia",
    slug: "hardware",
    title: "Hardware actual",
    eyebrow: "// tech.hw",
    intro:
      "El hardware evoluciona rápido: chips más eficientes, GPUs orientadas a IA, pantallas OLED y conectividad WiFi 7 redefinen lo que cabe en un PC o móvil.",
    sections: [
      { heading: "Chips ARM en PC", body: "Apple Silicon y Snapdragon X demuestran que ARM puede dominar el escritorio con eficiencia brutal." },
      { heading: "IA local", body: "GPUs con mucha VRAM y NPUs dedicadas permiten correr LLMs en local sin conexión." },
      { heading: "Conectividad", body: "WiFi 7, Bluetooth 5.4 y USB4/Thunderbolt 5 traen anchos de banda inéditos al consumidor." },
    ],
    tips: [
      "Considera consumo energético, no solo potencia.",
      "Refrigeración importa más de lo que crees.",
      "Compra para tus necesidades de hoy + 2 años.",
      "Mantén drivers y BIOS actualizados.",
    ],
    nexusPrompt: "Qué hardware está marcando tendencia este año y por qué.",
    sections: [],
  } as Topic,
  {
    category: "tecnologia",
    slug: "gaming",
    title: "Gaming",
    eyebrow: "// tech.gaming",
    intro:
      "El gaming es la industria de entretenimiento más grande del mundo. PC, consola, móvil y cloud gaming conviven y se cruzan.",
    sections: [
      { heading: "Consolas", body: "PS5, Xbox Series X|S y Nintendo Switch 2 dominan el mercado. Cada una con catálogos y filosofías distintas." },
      { heading: "Cloud gaming", body: "GeForce Now, Xbox Cloud y PlayStation Plus Premium permiten jugar AAA en cualquier dispositivo con buena conexión." },
      { heading: "Indie", body: "Steam, itch.io y consolas indie permiten que un solo dev publique mundialmente. La edad de oro indie." },
    ],
    tips: [
      "Steam Deck es PC gaming portátil real.",
      "Mira reviews independientes antes de comprar.",
      "Cuida tu salud: descansa, hidrátate, postura.",
      "Gaming en cloud necesita internet estable, no rápido.",
    ],
    nexusPrompt: "Qué consolas y plataformas dominan el gaming actual y cuál elegir.",
    sections: [],
  } as Topic,
  {
    category: "tecnologia",
    slug: "gadgets",
    title: "Gadgets",
    eyebrow: "// tech.gadgets",
    intro:
      "Wearables, móviles plegables, drones, gafas AR. Los gadgets transforman lo cotidiano y abren categorías nuevas.",
    sections: [
      { heading: "Wearables", body: "Smartwatches y anillos inteligentes miden salud, sueño y actividad. Apple Watch, Galaxy Watch y Oura lideran." },
      { heading: "AR/VR", body: "Meta Quest, Apple Vision Pro y PSVR2 acercan el computing espacial al consumidor." },
      { heading: "Móviles plegables", body: "Samsung Z Fold/Flip, Pixel Fold, Huawei. Forma versátil con compromisos en peso y precio." },
    ],
    tips: [
      "Revisa actualizaciones de software a largo plazo.",
      "Privacidad de datos: lee antes de aceptar.",
      "Repara antes que tirar (right-to-repair).",
      "No te dejes llevar por hype: evalúa utilidad real.",
    ],
    nexusPrompt: "Qué gadget tecnológico vale realmente la pena comprar hoy.",
    sections: [],
  } as Topic,
  {
    category: "tecnologia",
    slug: "futuro",
    title: "Futuro: robótica, espacio, biotec",
    eyebrow: "// tech.future",
    intro:
      "Robótica humanoide, exploración espacial privada y biotecnología están saliendo del laboratorio al mundo real.",
    sections: [
      { heading: "Robótica", body: "Figure, 1X y Tesla Optimus apuntan a humanoides generalistas. Aprendizaje por imitación + LLMs cambian el juego." },
      { heading: "Espacio", body: "SpaceX (Starship), Blue Origin, Rocket Lab. Costo de lanzamiento por kilo en caída libre. La Luna y Marte vuelven al mapa." },
      { heading: "Biotec", body: "CRISPR edita ADN, mRNA acelera vacunas, IA descubre fármacos. Medicina personalizada se acerca." },
    ],
    tips: [
      "Sigue cuentas de investigadores, no solo influencers.",
      "El hype acorta tiempos esperados; la realidad los alarga.",
      "Considera implicaciones éticas y sociales.",
      "Lee papers, no solo titulares.",
    ],
    nexusPrompt: "Qué tendencias futuras (robótica, espacio, biotec) impactarán más en los próximos años.",
    sections: [],
  } as Topic,
  {
    category: "tecnologia",
    slug: "noticias",
    title: "Noticias tecnológicas",
    eyebrow: "// tech.news",
    intro:
      "El ecosistema tech se mueve cada día. Estas son las áreas con más actividad y dónde seguirlas.",
    sections: [
      { heading: "Fuentes recomendadas", body: "The Verge, Ars Technica, TechCrunch, Hacker News, MIT Tech Review. Y para análisis técnico: blogs de ingenieros independientes." },
      { heading: "Qué pasa ahora", body: "GPT-5.5 redefiniendo razonamiento, humanoides aprendiendo en tiempo real, NPCs con LLMs en mundos virtuales, GPUs neuronales para IA local." },
      { heading: "Cómo filtrar el ruido", body: "Pregunta: ¿esto cambia cómo trabajo o cómo vivo? Si no, es marketing." },
    ],
    tips: [
      "Lee 3 fuentes distintas antes de opinar.",
      "Diferencia anuncio de demostración real.",
      "Sigue a desarrolladores, no solo a periodistas.",
      "Usa NEXUS para resumir noticias largas.",
    ],
    nexusPrompt: "Resúmeme las 5 noticias tech más importantes de este año.",
    sections: [],
  } as Topic,
];

export function findTopic(category: string, slug: string): Topic | undefined {
  return TOPICS.find((t) => t.category === category && t.slug === slug);
}

export function listTopicsByCategory(category: string): Topic[] {
  return TOPICS.filter((t) => t.category === category);
}
