import RSVP from "rsvp"
import _ from "lodash"

export default class AccountRepo {

  constructor(muon) {

    this.muon = muon

    var _this = this

    //TODO, decide how to store locally. is limited by local memory otherwise ...
    this.accounts = []

    function connect() {
      //_this.muon.replay("aether-password-registration", {}, function (event) {
      //  _this.addUser(event.payload).then((msg) => {
      //    console.log("User Added " + JSON.stringify(msg))
      //  }).catch((err) => {
      //    console.log("Error Processing User Password Update " + JSON.stringify(err))
      //  })
      //}, function (error) {
      //  console.log("Disconnected from event store, reconnecting ", error)
      //  setTimeout(connect, 1000)
      //}, function (complete) {
      //  console.log("Completed!")
      //  setTimeout(connect, 1000)
      //})

      // These are all hard coded I suppose

      //_this.muon.replay("aether-social-google-registration", {}, event => {
      //  _this.addUser()
      //})
    }

    connect()
  }

  getAccountByLoginId(loginType, id) {
    return _.find(this.accounts, (account) => _.find(account.logins, (login) => login.type == loginType && login.id == id))
  }

  /**
   *
   */
  getOrCreateAccountByLogin(principal) {
    var _this = this

    return new RSVP.Promise((resolve, reject) => {

      var account = _this.getAccountByLoginId(principal.type, principal.id)

      console.log("Account is :" + JSON.stringify(account))
      console.log("Login is :" + JSON.stringify(principal))

      if (!account) {
        account = JSON.parse(JSON.stringify(principal.detail))
        account.logins = []
        account.logins.push({type: principal.type, id: principal.id})
        _this.accounts.push(account)
      }

      var accountUpdate = {
        "event-type": "UserAccountUpdated",
        "schema": "http://www.simplicityitself.io/slack/1",
        "stream-name": "aether-password-registration",
        "service-id": "aether-password",
        payload: principal
      }

      _this.muon.emit(accountUpdate).then(function (resp) {
        logger.warn("Aether Registration Persisted" + JSON.stringify(resp))
        respond({
          success:true
        })
      }).catch(function (error) {
        logger.warn("Aether Registration FAILED " + JSON.stringify(error))
        respond({
          success:false,
          error: error
        })
      })

      console.log("Account is now: " + JSON.stringify(account))
      var detail = JSON.parse(JSON.stringify(account))
      delete detail.logins

      console.log("Detail is : " + JSON.stringify(detail))

      resolve(detail)
    })
  }
}
