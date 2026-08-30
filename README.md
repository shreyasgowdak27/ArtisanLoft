# ArtisanLoft: Professional Furniture E-commerce Application

ArtisanLoft is a modern, minimalist full-stack e-commerce application designed for high-end furniture retail. It features a clean, "artisan" aesthetic with a robust Spring Boot backend using Spring JDBC for efficient data handling and a React frontend built with Tailwind CSS.

## Features
- **Modern Artisan UI**: Minimalist design with muted earth tones and serif typography.
- **Product Gallery**: Responsive grid displaying handcrafted furniture with hover effects.
- **Detailed Item View**: Comprehensive product information with high-quality imagery.
- **Ordering System**: End-to-end flow for processing customer orders.
- **JDBC Persistence**: High-performance data access without the overhead of ORM.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile.

## Prerequisites
- **Java 17** or higher
- **Node.js 18.x** or higher
- **Maven 3.8+**
- **MySQL 8.0+**

## Installation & Setup

### 1. Database Setup
Ensure you have a MySQL server running.
1. Create a database named `artisanloft`.
2. Update the credentials in `src/main/resources/application.properties` if your MySQL `root` password is not `password`.

### 2. Backend Setup (Spring Boot)
Run these commands from the root directory:
    mvn clean install
    mvn spring-boot:run

The API will be available at `http://localhost:8080`.

### 3. Frontend Setup (React)
Open a new terminal and navigate to the `frontend` directory:
    cd frontend
    npm install
    npm start

The application will open automatically at `http://localhost:3000`.

## Configuration
- **Backend Port**: 8080 (Configurable in `application.properties`)
- **Frontend Port**: 3000
- **Database Initialization**: The application is configured to automatically run `schema.sql` and `data.sql` on startup to populate the 6 sample products.

## Troubleshooting
- **Connection Refused**: Ensure your MySQL server is running and the credentials in `application.properties` are correct.
- **CORS Errors**: The backend is configured to allow `*` origins for development. In production, update the `@CrossOrigin` annotation in `FurnitureController.java`.
- **Images Not Loading**: Ensure you have an active internet connection as images are served from Unsplash.

## Project Structure
- `src/main/java/com/artisanloft/`: Spring Boot backend code.
    - `controller/`: REST API endpoints.
    - `service/`: Business logic.
    - `repository/`: JDBC Template data access.
    - `model/`: Data objects.
- `src/main/resources/`: SQL scripts and configuration.
- `frontend/`: React application.
    - `src/api/`: Axios client configuration.
    - `src/components/`: Reusable UI elements.
    - `src/pages/`: Main view components.
