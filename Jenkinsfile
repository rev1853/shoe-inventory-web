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
                script {
                    sh 'rm -f .env frontend/.env || true'
                    withCredentials([file(credentialsId: 'laravel_env_file', variable: 'ENV_FILE')]) {
                        sh '''
                            cp "$ENV_FILE" .env
                            cp "$ENV_FILE" frontend/.env
                            chmod 600 .env frontend/.env
                        '''
                    }
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


        stage('Seed Database') {
            steps {
                sh 'docker compose run --rm backend php artisan db:seed --force'
            }
        }

        stage('Link Storage') {
            steps {
                sh 'docker compose run --rm --user root backend sh -c "chown -R www-data:www-data public storage && php artisan storage:link --force"'
            }
        }

        stage('Deploy Containers') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}
