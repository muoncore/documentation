import RSVP from "rsvp"

export class socialLoginProvider {
  constructor() {
    this.userDb = {}
  }

  getUser(user_id) {
    return this.userDb[user_id]
  }

  addUser(principal) {
    this.userDb[principal.user_id] = principal
    return principal
  }

  auth(principal) {
    return new RSVP.Promise(function(resolve, reject) {
      let user = this.getUser(principal.user_id)
      if(!user) {
        // auto create our user
        user = this.addUser(principal)
      }

      resolve({
        id: user.user_id,
        type: 'social',
        success: true,
        detail: {
          user_id: user.user_id,
          socialToken: user.socialToken,
          signature: user.socialToken.accessToken
        }
      })
    }.bind(this))
  }


}

export class socialRegistrationProvider {

  constructor() {
    this.userDb = {}
  }

  addUser(principal) {
    return new RSVP.Promise(function (resolve, reject) {
      if(principal.user_id) {

      }
    }.bind(this))
  }

  authorise(principal) {
    return new RSVP.Promise(function (resolve, reject) {
      if(principal.user_id) {

      }
    }.bind(this))
  }
}
