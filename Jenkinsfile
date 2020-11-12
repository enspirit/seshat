pipeline {
  agent any

  environment {
    SLACK_CHANNEL = '#opensource-cicd'
  }

  stages {

    stage ('Start') {
      steps {
        cancelPreviousBuilds()
        sendNotifications('STARTED', SLACK_CHANNEL)
      }
    }

    stage ('Building Docker Images') {
      steps {
        container('builder') {
          sh 'make -j images'
        }
      }
    }

    stage ('Start seshat') {
      steps {
        container('builder') {
          sh 'make up'
        }
      }
    }

    stage ('Testing') {
      steps {
        container('builder') {
          script {
            sh 'make test'
          }
        }
      }
    }
  }

  post {
    always {
      container('builder') {
        sh 'make down'
      }
    }
    success {
      sendNotifications('SUCCESS', SLACK_CHANNEL)
    }
    failure {
      sendNotifications('FAILED', SLACK_CHANNEL)
    }
  }

}
