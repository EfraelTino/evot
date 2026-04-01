# Evot - Plataforma para crear chatbots con IA para páginas web

Evot es una plataforma que permite a emprendedores y PyMEs crear e integrar chatbots con IA en sus páginas web de manera sencilla, sin necesidad de conocimientos técnicos.

**Problema a resolver: ** las pequeñas empresas no tienen acceso a herramientas de atención al cliente automatizada por su complejidad o costo. Evot facilita el acceso a un chatbot inteligente con memoria de conversación, validación por dominio y respuestas personalizadas según el negocio.

# Demo: 
- https://evot.tech/
- 
### Vistas y funcionamiento de la app

**Iniciar sesión, Crear cuenta.**
<img width="1916" height="905" alt="Image" src="https://github.com/user-attachments/assets/7cbaf8ec-9d56-43c1-a820-78fd32db9b86" />

**Espacios de trabajo:**
<img width="1916" height="917" alt="Image" src="https://github.com/user-attachments/assets/86fc3c3f-1d82-4279-a762-a7ccbd4607af" />

**Bots de un workspace(páginas web de prueba), se puede añadir bots así como también editar**
<img width="1917" height="920" alt="Image" src="https://github.com/user-attachments/assets/c15d0578-ee10-41e6-a17b-6693104074cc" />

**Editar bot, acá se configura el logo, colores, nombre del bot y se introduce el prompt que usará el bot integrado con IA**
<img width="1142" height="715" alt="Image" src="https://github.com/user-attachments/assets/d070d84f-2c23-48fb-ab1f-77c137e5f382" />

**Historial de todas las conversaciones que el bot genera**
<img width="1910" height="902" alt="Image" src="https://github.com/user-attachments/assets/a0f3c9a3-984e-4941-9a0d-a21d50d02f16" />

# Ejecución: 
# Ejecución

## Requisitos
- Node.js 18+
- pnpm

## Instalación

1. Clona el repositorio
git clone https://github.com/EfraelTino/my-chat-widget.git
cd my-chat-widget

2. Instala las dependencias
pnpm install

3. Configura las variables de entorno, crea un archivo `.env` con:
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_WEBHOOK_URL=https://tu-webhook-url.com

4. Inicia el servidor de desarrollo
pnpm dev

## Build para producción
pnpm build

# 🛠️ Stack

- React + Vite
- Supabase (base de datos y autenticación)
- Nginx (servidor web)
- n8n (automatización y webhooks)
- OpenAI (IA del chatbot)

# 📧 Contacto
efrael2001@gmail.com
