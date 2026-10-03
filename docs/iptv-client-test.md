# Prueba de cliente IPTV — IPZStream 0.5.0

## Requisitos
- IPZStream 0.5.0 instalado y servicio API activo.
- Al menos un canal en estado Activo y ejecutándose mediante FFmpeg/HLS.
- Un paquete IPTV activo.
- Un usuario IPTV activo, no vencido, con contraseña y paquete asignado.
- Si el paquete tiene canales seleccionados, el canal de prueba debe estar permitido.

## Prueba automática del servidor
Ejecutar desde el servidor IPZStream:

```bash
node scripts/test-iptv-client.mjs http://127.0.0.1:3100 USUARIO CONTRASENA
```

La prueba valida:
1. `player_api.php` y autenticación.
2. categorías live.
3. listado de streams.
4. playlist M3U.
5. manifiesto HLS del primer canal permitido.
6. compatibilidad de URL `.ts`.

## Datos para una app compatible con Xtream Codes API
- Servidor: `http://IP-O-DOMINIO:PUERTO`
- Usuario: usuario IPTV creado en IPZStream.
- Contraseña: contraseña IPTV del usuario.

No añadir `/player_api.php` al campo servidor salvo que la app lo pida expresamente.

## Playlist M3U
Formato disponible:

```text
http://IP-O-DOMINIO:PUERTO/get.php?username=USUARIO&password=CONTRASENA&type=m3u_plus&output=m3u8
```

Para apps que soliciten salida TS también se acepta `output=ts`; IPZStream redirige el acceso live TS al HLS administrado por el servidor.

## Criterio de aceptación
La entrega se considera validada cuando una app externa:
- autentica al usuario;
- muestra únicamente sus canales permitidos;
- abre un canal real;
- mantiene reproducción;
- aparece como conexión activa en el panel;
- respeta el máximo de conexiones;
- deja de reproducir temporalmente al usar Cerrar conexión desde el panel.
