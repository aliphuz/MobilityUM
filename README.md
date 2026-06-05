# Mobility System

This repository contains a mobility application system with a .NET backend and a React frontend.

## Project structure

- `Backend/` - ASP.NET Core backend project
- `frontend/` - React + Vite frontend project
- `ERD/` - Entity relationship diagrams or design artifacts
- `fyp-presentation/` - Presentation generator and materials

## Getting started

### Backend

1. Open `Backend/Backend.sln` in Visual Studio or use the .NET CLI.
2. Restore dependencies:
   ```bash
   dotnet restore Backend/Backend.csproj
   ```
3. Run the backend:
   ```bash
   dotnet run --project Backend/Backend.csproj
   ```

### Frontend

1. Change into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Notes

- The backend uses `appsettings.json` and `appsettings.Development.json` for configuration.
- A sample development configuration is provided in `Backend/appsettings.Development.json.example`.
- Do not commit `Backend/appsettings.Development.json` because it can contain local secrets.
- The frontend is built with Vite and React.
- Add any GitHub secrets or environment-specific settings locally as needed.

## GitHub remote setup

To push this repository to GitHub, run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/aliphuz/MobilityUM.git
git push -u origin main
```

If your GitHub repository uses `master` instead of `main`, replace `main` with `master`.
