# VestaLog

Outil interne de la Croix-Rouge française pour gérer les missions de secourisme (DPS, SAMU 92,
maraudes, formations) : inscription des bénévoles, gestion du matériel médical (lots, sacs,
pochettes) et vérification de l'inventaire avant/après mission.

> **Ce fichier a été généré avec l'assistance d'une IA (Claude Code, Anthropic).**

## Stack technique

- **Backend** : Spring Boot 4, Java 21, Spring Security (JWT stateless), Spring Data JPA, PostgreSQL
- **Frontend** : React 18 + Vite, React Router
- **Auth** : magic link par email (Brevo) — aucun mot de passe stocké
- **Dev** : backend sur `:8080`, frontend sur `:3000` (proxy Vite → backend)

## Fonctionnalités

- Authentification sans mot de passe (lien à usage unique envoyé par email)
- Création et gestion des missions, inscription des bénévoles
- Gestion de l'inventaire : lots → sacs → pochettes → consommables
- Vérification du matériel avant une mission (checklist par mission)
- Back-office admin : consommables, lots, types de mission, utilisateurs et rôles

## Démarrer en local

```bash
# Base de données
docker run --name vestalog-pg -e POSTGRES_DB=vestalog -e POSTGRES_USER=vestalog \
  -e POSTGRES_PASSWORD=vestalog -p 5432:5432 -d postgres:16

# Backend
cd backend && mvn spring-boot:run

# Frontend
cd frontend && npm install && npm run dev
```

## Structure

```
backend/   API Spring Boot (controller / service / repository / entity)
frontend/  SPA React (pages / components / hooks)
```
