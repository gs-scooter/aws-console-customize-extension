/**
 * AWS Console Customize Extension
 * Created by fumiharu kinoshita
 */
const agent = window.navigator.userAgent.toLowerCase();
const SETTING_KEY = 'awsconsole';

var intervalId;
var retryLimit = 60

function getStorage() {
  if (agent.indexOf("chrome") != -1) {
    // chrome extension
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(SETTING_KEY, (ruleList) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(ruleList);
        }
      })
    });
  } else {
    // other browser
    return browser.storage.sync.get(SETTING_KEY);
  }
}


function applyRule(rule) {
  // header
  $('header > nav').css('background-color', rule.color);
  $('.globalNav-0366 > a').css('background-color', rule.color);

  // footer
  $('#console-nav-footer-inner').css('background-color', rule.color);

  // label
  if (rule.showLabel && rule.label != null && rule.label.length > 0) {
    $('body').prepend('<span id="ruleLabel">' + rule.label + '</span>');
  }
}


function findAccount() {
  var name = $("span[data-testid='awsc-nav-account-menu-button'] span:first").text();
  var acct = $("div[data-testid='account-detail-menu'] span:nth-child(2)").text();
  if (name != '') {
    //console.log(name, acct);
    acct = acct.replaceAll('-', '');
    clearInterval(intervalId);

    var regions = location.search.match(/region=(.*?)(&|$)/);
    var region = "";
    if (regions != null && regions.length > 1) {
      region = regions[1];
    }
  
    // load setting.
    getStorage().then(ruleList => {

      ruleList[SETTING_KEY].some(rule => { 
        var re = new RegExp(rule.user);
        if (rule.enableRule && (re.test(name) || re.test(acct))) {
          if (region == rule.region || "all-region" == rule.region) {
            // apply rule.
            applyRule(rule);
            return true;
          }
        }
      });
    }, 
    err => {
      console.error(err);
    });
  }
  if (--retryLimit <= 0) {
    clearInterval(intervalId);
  }

}

// main function
$(function() {
  // show/hide label
  $('#consoleNavHeader').hover( 
    () => $('#ruleLabel').css('visibility', 'hidden'),
    () => $('#ruleLabel').css('visibility', '')
  );
  
  // waiting loading.
  intervalId = setInterval(findAccount, 1000);
});
