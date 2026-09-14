import React from 'react';
import { Activity, BarChart3, CalendarDays, Database, FileText, Home, ListVideo, Menu, Package, PlaySquare, Radio, RefreshCw, Server, Settings as SettingsIcon, Smartphone, Users as UsersIcon, Wifi, Shield, HardDrive, Save } from 'lucide-react';
import UsersPage from './modules/users/Users.jsx';
import './styles.css';

const nav=[['Dashboard','dashboard',Home],['Usuarios','users',UsersIcon],['Servidores / Nodos','nodes',Server],['Canales','channels',Radio],['VOD / Series','vod',PlaySquare],['EPG','epg',CalendarDays],['Listas M3U','m3u',ListVideo],['Paquetes / Perfiles','packages',Package],['Conexiones Activas','connections',Activity],['Dispositivos','devices',Smartphone],['Logs / Auditoría','logs',FileText],['Estadísticas','stats',BarChart3],['Configuración','settings',SettingsIcon]];
const generic={nodes:['Servidores / Nodos','Administra servidores de streaming y su estado.'],channels:['Canales','Gestiona canales en vivo y fuentes de señal.'],vod:['VOD / Series','Organiza películas, series y contenido bajo demanda.'],epg:['EPG','Programa y administra la guía electrónica.'],m3u:['Listas M3U','Controla listas, fuentes y accesos.'],packages:['Paquetes / Perfiles','Define planes, límites y contenido.'],connections:['Conexiones Activas','Supervisa sesiones y consumo.'],devices:['Dispositivos','Controla equipos autorizados y sesiones.'],logs:['Logs / Auditoría','Consulta actividad y eventos del sistema.']};

// Resto del archivo se conserva sin cambios respecto al estado de main.
