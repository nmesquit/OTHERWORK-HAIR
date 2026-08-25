# Deploy OTHERWORK / HAIR v9

This build is prepared to run on any Docker-capable host.

## Fastest route for a live test
A simple path is a Docker host with a persistent disk, such as Render.

1. Create a new private Git repository.
2. Upload the contents of this project.
3. Create a new Render Blueprint or Web Service from the repository.
4. Render will detect `render.yaml`.
5. Use the persistent disk defined in the blueprint.
6. After deployment, open the HTTPS URL Render gives you.
7. Sign in with the local demo account:
   - demo@otherwork.local
   - otherworkdemo
8. On iPhone/iPad: Safari → Share → Add to Home Screen.

## Important
This is a beta-test deployment structure, not a final production architecture.

Before accepting real paying salons/clients:
- replace local authentication with managed auth
- move database to managed Postgres
- move images to object storage
- add backups
- implement true tenant isolation
- connect real SMS/email provider
- connect payment providers
- add privacy/terms and data export/deletion
- rotate/remove demo credentials
