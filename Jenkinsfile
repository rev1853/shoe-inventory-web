pipeline {
    agent any
    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Secrets') {
            steps {
                withCredentials([file(credentialsId: 'laravel_env_file', variable: 'ENV_FILE')]) {
                    sh '''
                        TEMP_ENV=$(mktemp)
                        cp "$ENV_FILE" "$TEMP_ENV"
                        docker run --rm -v "$PWD":/app -w /app alpine cp "$TEMP_ENV" /app/.env
                        docker run --rm -v "$PWD/frontend":/app -w /app alpine cp "$TEMP_ENV" /app/.env
                        rm "$TEMP_ENV"
                    '''
                }
            }
        }

        stage('Backend Dependencies & Tests') {
            steps {
                sh 'docker run --rm -v "$PWD":/app -w /app composer install --no-interaction --prefer-dist'
                sh 'docker run --rm -v "$PWD":/app -w /app php:8.3-cli php artisan key:generate --force'
                sh 'docker run --rm -v "$PWD":/app -w /app php:8.3-cli php artisan test'
            }
        }

        stage('Frontend Build') {
            steps {
                sh 'docker run --rm -v "$PWD/frontend":/app -w /app node:20 npm ci'
                sh 'docker run --rm -v "$PWD/frontend":/app -w /app node:20 npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Run Migrations') {
            steps {
                sh 'docker compose run --rm backend php artisan migrate --force'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}
