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
                        cp "$ENV_FILE" .env
                        cp "$ENV_FILE" frontend/.env
                    '''
                }
            }
        }

        stage('Backend Dependencies & Tests') {
            steps {
                sh 'composer install --no-interaction --prefer-dist'
                sh 'php artisan key:generate --force'
                sh 'php artisan test'
            }
        }

        stage('Frontend Build') {
            steps {
                sh 'npm ci --prefix frontend'
                sh 'npm run build --prefix frontend'
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
