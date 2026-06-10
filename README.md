# FRASCO · Panel de Operación

CRM y planificador de producción de FRASCO Creative Office.

- **Stack:** HTML/CSS/JS en un solo archivo · Firebase (Auth + Firestore) · Vercel
- **Funciones:** clientes y paquetes, calendario semanal con planificador automático (L-V 9-6, sáb 9-2), cobros mensuales, proyectos esporádicos, ideas de contenido con IA (API de Anthropic), roles (dueño / asistente)

## Despliegue
1. Importar este repo en Vercel (proyecto estático, sin build)
2. Dominio: `panel.<dominio>` → CNAME a `cname.vercel-dns.com` (DNS only)
3. Firebase: usuario en Authentication + reglas de Firestore publicadas
4. API key de Anthropic en ⚙ Ajustes dentro del panel
