pipeline {
  agent any

  environment {
    SLACK_CHANNEL = '#opensource-cicd'
    DOCKER_TAG = get_docker_tag()
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

    stage ('Linting') {
      steps {
        container('builder') {
          script {
            sh 'make lint'
          }
        }
      }
    }

    stage ('Testing') {
      steps {
        container('builder') {
          script {
            sh 'make tests'
          }
        }
      }
    }

    // stage ('Pushing Docker Images') {
    //   when {
    //     anyOf {
    //       branch 'master'
    //       buildingTag()
    //     }
    //   }
    //   steps {
    //     container('builder') {
    //       script {
    //         docker.withRegistry('', 'dockerhub-credentials') {
    //           sh 'make release'
    //         }
    //       }
    //     }
    //   }
    // }
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

def get_docker_tag() {
  if (env.TAG_NAME != null) {
    return env.TAG_NAME
  }
  return 'latest'
}
