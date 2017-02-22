import { Random } from 'meteor/random'
import { jLouvain } from 'mmfcordeiro:jlouvain'

var Edges = new Mongo.Collection('edges');
var EdgesCopy = new Mongo.Collection('edges_copy');

if (Meteor.isClient) {

    var s;

    var slider;

    var config = {
        worker: true
    };

    Session.setDefault('startForceAtlas2', 0);
    Session.setDefault('play', 0);

    Meteor.call('range', function(err, response) {
        Session.setDefault("slider", [new Date(timestamp(response.min)), new Date(timestamp(response.max))]);
    });

    Template.token.helpers({
        theToken: function () {
            return Session.get("token");
        }
    });

    Session.set("token", Random.id());

    Template.layout.helpers({
        counter: function() {
            return Session.get('startForceAtlas2');
        }
    });

    Template.layout.events({
        'click button': function() {
            if (Session.get('startForceAtlas2') === 0) {
                Session.set('startForceAtlas2', 1);
                s.startForceAtlas2(config);
            } else {
                Session.set('startForceAtlas2', 0);
                s.stopForceAtlas2();
                s.killForceAtlas2();
            };

        }
    });

    Template.time.helpers({
        play: function() {
            return Session.get('play');
        }
    });

    function forward(increment, once) {        
        if (Session.get('play') == 1) {
            var newbegin = new Date(timestamp(Number(slider.noUiSlider.get()[0]) + (increment)));
            var newend = new Date(timestamp(Number(slider.noUiSlider.get()[1]) + (increment)));

            slider.noUiSlider.set([newbegin.getTime(), newend.getTime()]);
            Session.set("slider", [newbegin, newend]);

            if (newbegin.getTime() == newend.getTime())
            {
                console.log(newbegin);
                console.log(newend);
                Session.set('play', 0);
                return;
            }

            slider.setAttribute('disabled', true);
            Meteor.call('render', new Date(+newbegin), new Date(+newend), Session.get("token"), function(err, response) {
                slider.removeAttribute('disabled');
                if(once == false) {
                    forward(increment, once);
                }

                s.refresh();
                if (Session.get('startForceAtlas2') === 1) {
                    s.killForceAtlas2();
                    s.startForceAtlas2(config);
                };
            });
        }         
    }

    Template.time.events({
        'click #previous': function() {
            Session.set('play', 1);
            forward(-1 * 1000 * 24 * 60 * 60, true);
            Session.set('play', 0);
        },
        'click #play': function() {
            if (Session.get('play') == 0) {
                Session.set('play', 1);

                forward(1000 * 24 * 60 * 60, false);

            } else {
                Session.set('play', 0);
            };
        },        
        'click #next': function() {
            Session.set('play', 1);
            forward(1000 * 24 * 60 * 60, true);
            Session.set('play', 0);
        }
    });

    Template.container.rendered = function() {
        if (!this._rendered) {
            this._rendered = true;

            s = new sigma({
                container: 'graph-container',
                //type: 'webgl',
                settings: {
                    drawEdges: true
                }
            });

            s.settings({
                edgeColor: 'default',
                defaultEdgeColor: 'grey'
            });

            var hasNode = function(id) {
                if (s.graph.nodes(id) != null) {
                    return true;
                } else {
                    return false;
                }
            }

            var addNode = function(document) {
                if (!hasNode(document.id)) {
                    s.graph.addNode({
                        id: document.id,
                        label: document.id,
                        size: document.size,
                        x: document.x,
                        y: document.y
                    });
                } else {
                    updateNode(document, 1);
                }
                //s.refresh();
            }

            var dropNode = function(id) {
                var node = getNode(id);
                if (node != null) {
                    if (node.size == 1) {
                        s.graph.dropNode(node.id);
                    } else {
                        updateNode(node, -1);
                    };
                    //s.refresh();
                }
            }

            var updateNode = function(document, increment) {
                if (hasNode(document.id)) {
                    var node = s.graph.nodes(document.id);
                    node.id = document.id;
                    //node.label = document.label;
                    node.size = document.size + increment;
                    node.x = document.x;
                    node.y = document.y;
                    //node.color = document.color;
                }
                //s.refresh();
            }

            var getNode = function(id) {
                var node = null;
                if (hasNode(id)) {
                    var node = s.graph.nodes(id);
                }
                return node;
            }

            var hasEdge = function(id) {
                if (s.graph.edges(id) != null) {
                    return true;
                } else {
                    return false;
                }
            }

            var addEdge = function(document) {
                if (document.source != document.target) {
                    addNode({
                        id: document.source,
                        x: Math.floor((Math.random() * 100) + 1),
                        y: Math.floor((Math.random() * 100) + 1),
                        size: 1
                    });

                    addNode({
                        id: document.target,
                        x: Math.floor((Math.random() * 100) + 1),
                        y: Math.floor((Math.random() * 100) + 1), 
                        size: 1
                    });

                    s.graph.addEdge({
                        id: document.id,
                        source: document.source,
                        target: document.target
                    });

                    //s.refresh();
                    //if (Session.get('startForceAtlas2') === 1) {
                    //    s.killForceAtlas2();
                    //    s.startForceAtlas2(config);
                    //};
                };

            }

            var dropEdge = function(document) {
                if (hasEdge(document.id)) {
                    s.graph.dropEdge(document.id);
                }
                dropNode(document.source);
                dropNode(document.target);
                //s.refresh();
                //if (Session.get('startForceAtlas2') === 1) {
                //    s.killForceAtlas2();
                //    s.startForceAtlas2(config);
                //}
            }

            var updateEdge = function(document) {
                var edge = s.graph.edges(document.id);

                if (!hasNode(document.source)) {
                    s.graph.addNode({
                        id: document.source
                    });
                };

                if (!hasNode(document.target)) {
                    s.graph.addNode({
                        id: document.target
                    });
                };

                edge.source = document.source;
                edge.target = document.target;
                //s.refresh();
                //if (Session.get('startForceAtlas2') === 1) {
                //    s.killForceAtlas2();
                //    s.startForceAtlas2(config);
                //};
            }

            Edges.find({token: Session.get("token")}).observe({
                added: function(document) {
                    addEdge(document);
                },
                removed: function(document) {
                    dropEdge(document);
                },
                changed: function(document) {
                    updateEdge(document);
                }
            });
        }
    }

    // Create a new date from a string, return as a timestamp.
    function timestamp(str) {
        return new Date(str).getTime();
    }

    // Create a list of day and monthnames.
    var
        weekdays = [
            "Sunday", "Monday", "Tuesday",
            "Wednesday", "Thursday", "Friday",
            "Saturday"
        ],
        months = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

    // Append a suffix to dates.
    // Example: 23 => 23rd, 1 => 1st.
    function nth(d) {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }

    // Create a string representation of the date.
    function formatDate(date) {
        return weekdays[date.getDay()] + ", " +
            date.getDate() + nth(date.getDate()) + " " +
            months[date.getMonth()] + " " +
            date.getFullYear();
    }


    Template.slider.rendered = function() {

        slider = document.getElementById('slider');

        Meteor.call('range', function(err, response) {

            var start = timestamp(response.min) + (timestamp(response.max) - timestamp(response.min)) / 2;
            var end = timestamp(response.min) + (timestamp(response.max) - timestamp(response.min)) / 2 + 4 * 7 * 24 * 60 * 60 * 1000;

            Session.set('slider', [new Date(+start), new Date(+end)]);
            slider.setAttribute('disabled', true);
            Meteor.call('render', new Date(+start), new Date(+end), Session.get("token"), function(err, response) {
                slider.removeAttribute('disabled');

                s.refresh();
                if (Session.get('startForceAtlas2') === 1) {
                    s.killForceAtlas2();
                    s.startForceAtlas2(config);
                };
            });

            noUiSlider.create(slider, {
                connect: true,
                // Create two timestamps to define a range.
                range: {
                    min: timestamp(response.min),
                    max: timestamp(response.max)
                },
                behaviour: 'drag',
                // Steps of one week
                step: 1 * 24 * 60 * 60 * 1000,
                // Two more timestamps indicate the handle starting positions.
                start: [start, end]
            });


            slider.noUiSlider.on('slide', function(values, handle, unencoded) {
                // set real values on 'slide' event
                Session.set('slider', [new Date(+values[0]), new Date(+values[1])]);
            });

            slider.noUiSlider.on('change', function(values, handle, unencoded) {
                // round off values on 'change' event
                Session.set('slider', [new Date(+values[0]), new Date(+values[1])]);
                slider.setAttribute('disabled', true);
                Meteor.call('render', Session.get("slider")[0], Session.get("slider")[1], Session.get("token"), function(error, response) {
                    slider.removeAttribute('disabled');

                    s.refresh();
                    if (Session.get('startForceAtlas2') === 1) {
                        s.killForceAtlas2();
                        s.startForceAtlas2(config);
                    };
                });
            });

            var tipHandles = slider.getElementsByClassName('noUi-handle'),
                tooltips = [];

            // Add divs to the slider handles.
            for (var i = 0; i < tipHandles.length; i++) {
                tooltips[i] = document.createElement('div');
                tipHandles[i].appendChild(tooltips[i]);
            }


            // Add a class for styling
            tooltips[0].className += 'tooltip';
            // Add additional markup
            tooltips[0].innerHTML = '<span></span>';
            // Replace the tooltip reference with the span we just added
            tooltips[0] = tooltips[0].getElementsByTagName('span')[0];

            // Add a class for styling
            tooltips[1].className += 'tooltip';
            // Add additional markup
            tooltips[1].innerHTML = '<span></span>';
            // Replace the tooltip reference with the span we just added
            tooltips[1] = tooltips[1].getElementsByTagName('span')[0];

            // When the slider changes, write the value to the tooltips.
            slider.noUiSlider.on('update', function(values, handle) {
                tooltips[handle].innerHTML = formatDate(new Date(+values[handle]));
            });
        });
    };

    Template.slider.helpers({
        slider: function() {
            return Session.get("slider");
        }
    });
}

if (Meteor.isServer) {
    // code to run on server at startup
    Meteor.startup(function() {

        Meteor.methods({
            render: function(begin, end, token) {
                console.log('render called with begin: ' + begin + ' end: ' + end +  ' token: '+ token + ' started');

                // remove edges ouside the interval
                console.time("Edges.remove");
                Edges.remove({
                    $and: [{ token: token }, {
                        $or: [{
                            date: {
                                $lt: new Date(begin)
                            }
                        }, {
                            date: {
                                $gte: new Date(end)
                            }
                        }]
                    }]
                });                
                console.timeEnd("Edges.remove");               

                // add edges inside the interval                
                console.time("EdgesCopy.find"); 
                EdgesCopy.find({
                    date: {
                        $gte: new Date(begin),
                        $lt: new Date(end)
                    }
                }).forEach(function(edge) {
                    edge.token = token;
                    // replace the 3-byte machine identifier by the 3 first chars of the token
                    token3bytehexcode = token[0].charCodeAt(0).toString(16) + token[1].charCodeAt(0).toString(16) + token[2].charCodeAt(0).toString(16)
                    edge._id = edge._id._str.substring(0, 8) + token3bytehexcode + edge._id._str.substring(14, edge._id._str.length);

                    Edges.insert(edge, function(error, result) {});
                });                
                console.timeEnd("EdgesCopy.find"); 

                console.log('render called with begin: ' + begin + ' end: ' + end +  ' token: '+ token + ' ended');
                return "begin: " + begin + "end: " + end;
            },
            range: function() {

                var min_date = EdgesCopy.find({}, {
                    limit: 1,
                    sort: {
                        date: 1
                    }
                }).fetch()[0].date;

                var max_date = EdgesCopy.find({}, {
                    limit: 1,
                    sort: {
                        date: -1
                    }
                }).fetch()[0].date;

                console.log('min: ' + min_date);
                console.log('max: ' + max_date);

                return {
                    'min': min_date,
                    'max': max_date
                };
            }
        });

    });
}