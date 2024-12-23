# Chat Application

This is a full-stack chat application built using Node.js, MongoDB, and React. It provides real-time messaging and user authentication using JWT.

## Running Locally

### Server Setup

1. Navigate to the server directory:

    ```
    cd server
    ```

2. Install dependencies and start the server:

    ```
    npm install
    npm run dev
    ```

3. The server will be running on `http://localhost:5000`.

### Client Setup

1. Navigate to the client directory:

    ```
    cd client
    ```

2. Install dependencies and start the client:

    ```
    npm install
    npm start
    ```

3. Open your browser and navigate to `http://localhost:3000`.

---

## Running with Docker

1. Clone the repository:

    ```
    git clone <repository-url>
    cd <repository-folder>
    ```

2. Build and start the Docker containers:

    ```
    docker-compose up --build
    ```

3. The client will be available at `http://localhost:3000`, and the server at `http://localhost:5000`.

---

## Environment Variables

Create a `.env` file insider server folder:

    ```
    touch .env
    ```

    Add the following variables:

    ```
    MONGODB_URI=mongodb://localhost:27017/your_db
    JWT_SECRET=your_secret_key
    PORT=5000
    ENCRYPTION_SECRET_KEY=your_key

    ```
