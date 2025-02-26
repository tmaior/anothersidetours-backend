# Backend


<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

---

## 📦 Technology Stack

### 📜 Language & Runtime

- **Language:** [TypeScript](https://www.typescriptlang.org/)  
  The project uses TypeScript as its primary language, as seen by the inclusion of packages like `typescript`, `ts-node`, and `ts-loader`.

- **Runtime:** [Node.js](https://nodejs.org/)  
  The application is designed to run in a Node.js environment.

### 🚀 Frameworks

- **Backend:** [NestJS](https://nestjs.com/)
    - **Core Framework Packages:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
    - **CLI and Testing:** `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`
    - NestJS is used as the primary backend framework, providing structure, dependency injection, and a modular architecture.

- **Database & ORM:** [Prisma](https://www.prisma.io/)
    - **ORM Packages:** `prisma`, `@prisma/client`
    - Prisma is used for database access and object-relational mapping.

---

## Setup Instructions

### Prerequisites

- **Git:** [Download Git](https://git-scm.com/downloads)
- **Node.js:** [Download Node.js](https://nodejs.org/)
- **Yarn:** [Install Yarn](https://classic.yarnpkg.com/en/docs/install)

### Step 1: Clone the Repository

Open your terminal and run the following command. Replace `<repository-url>` with your project's Git URL:

```bash
  git clone <repository-url>
```

After cloning go to the folder where you clonned the project.

```bash
  cd your-project-directory
```

Install Dependencies

```bash
  yarn install
```


Build the Application
```bash
  yarn build
```

Start the Application

```bash
  yarn start
```
Or using

```bash
  yarn dev
```