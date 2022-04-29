const minimist = require("minimist")

const args = minimist(process.argv.slice(2))

// See what is stored in the object produced by minimist
console.log(args)
// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

const logdb = require('./src/services/database.js');

const debug = args.debug || false;
const log = args.log || true;
const port = args.port || 5000

// Require Express.js
const express = require('express');
const app = express();
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
// Serve static HTML files
//app.use(express.static('./public'));
app.use(cors());

// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});

app.use( (req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = logdb.prepare('INSERT INTO accesslog (remote_addr, remote_user, date, method, url, http_version, status, referrer_url, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const x = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent);
    next();
})


// Oh look
if (debug) {
    // Returns all records in the 'accesslog' table
    app.get('/app/log/access', (req, res, next) => {
        const stmt = logdb.prepare('SELECT * FROM accesslog').all();
        res.status(200).json(stmt);
    });
    // Returns an error
    app.get('/app/error', (req, res, next) => {
      throw new Error('Error Test Successful');
    });
}


if (log !== 'false') {
  // Use morgan for logging to files
  // Create a write stream to append (flags: 'a') to a file
  const accesslog = fs.createWriteStream('access.log', { flags: 'a' })
  // Set up the access logging middleware
  app.use(morgan('combined', { stream: accesslog }))


}

// Place your server entry point code here
app.get('/app/', (req, res) => {
    res.status(200).json({"message":"your API works! (200)"});

});

app.get('/app/flip', (req, res) => {
    // Insert code here
    const flip = coinFlip();
    res.status(200).json({flip});
});

app.get('/app/flips/:number', (req, res) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.get('/app/flip/coin/', (req, res) => {
    // Insert code here
});

app.get('/app/flip/call/:guess(heads|tails)/', (req, res) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

app.post('/app/flip/call/', (req, res) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

app.post('/app/flip/coins/', (req, res) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.post('/app/user/login/', (req, res) => {
    // Insert code here
});

app.post('/app/user/new/', (req, res) => {
    // Insert code here
});

app.patch('/app/user/update', (req, res) => {
    // Insert code here
});

app.delete('/app/user/delete/', (req, res) => {
    // Insert code here
})


/** Coin flip functions 
 * This module will emulate a coin flip given various conditions as parameters as defined below
 */

/** Simple coin flip
 * 
 * Write a function that accepts no parameters but returns either heads or tails at random.
 * 
 * @param {*}
 * @returns {string} 
 * 
 * example: coinFlip()
 * returns: heads
 * 
 */

 function coinFlip() {
    let rand = Math.random();
    if (rand < 0.5) {
      return "heads";
    } else {
      return "tails";
    }
  }
  
  /** Multiple coin flips
   * 
   * Write a function that accepts one parameter (number of flips) and returns an array of 
   * resulting "heads" or "tails".
   * 
   * @param {number} flips 
   * @returns {string[]} results
   * 
   * example: coinFlips(10)
   * returns:
   *  [
        'heads', 'heads',
        'heads', 'tails',
        'heads', 'tails',
        'tails', 'heads',
        'tails', 'heads'
      ]
   */
  
  function coinFlips(flips) {
    let array = [];
    for (let i = 0; i < flips; i++) {
      array[i] = coinFlip();
    }
    return array;
  }
  
  /** Count multiple flips
   * 
   * Write a function that accepts an array consisting of "heads" or "tails" 
   * (e.g. the results of your `coinFlips()` function) and counts each, returning 
   * an object containing the number of each.
   * 
   * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
   * { tails: 5, heads: 5 }
   * 
   * @param {string[]} array 
   * @returns {{ heads: number, tails: number }}
   */
  
  function countFlips(array) {
    let numHeads = 0;
    let numTails = 0;
    for (let i = 0; i < array.length; i++) {
      if (array[i] === "heads") {
        numHeads++;
      } else {
        if (array[i] === "tails") {
          numTails++;
        }
      }
    }
    if (numHeads == 0) {
      return { "tails": numTails };
    } else {
      if (numTails == 0) {
        return { "heads": numHeads };
      } else {
        return { "heads": numHeads, "tails": numTails };
      }
    }
  }
  
  /** Flip a coin!
   * 
   * Write a function that accepts one input parameter: a string either "heads" or "tails", flips a coin, and then records "win" or "lose". 
   * 
   * @param {string} call 
   * @returns {object} with keys that are the input param (heads or tails), a flip (heads or tails), and the result (win or lose). See below example.
   * 
   * example: flipACoin('tails')
   * returns: { call: 'tails', flip: 'heads', result: 'lose' }
   */
  
  function flipACoin(call) {
    let actual = coinFlip();
    if (actual === call) {
      return { "call": call, "flip": actual, result: "win" }
    } else {
      return { "call": call, "flip": actual, result: "lose" }
    }
  }