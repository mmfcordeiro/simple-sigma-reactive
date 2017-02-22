// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by jlouvain.js.
import { name as packageName } from "meteor/mmfcordeiro:jlouvain";

// Write your tests here!
// Here is an example.
Tinytest.add('jlouvain - example', function (test) {
  test.equal(packageName, "jlouvain");
});
