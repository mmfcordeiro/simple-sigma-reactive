var Nodes = new Mongo.Collection('nodes');
var Edges = new Mongo.Collection('edges');

if (Meteor.isClient) {

    var s;
    // counter starts at 0
    Session.setDefault('startForceAtlas2', 0);


    Template.body.helpers({
        tasks: function() {
            return Tasks.find({});
        }
    });


    Template.hello.helpers({
        counter: function() {
            return Session.get('startForceAtlas2');
        }
    });

    Template.hello.events({
        'click button': function() {
            if (Session.get('startForceAtlas2') === 0) {
                Session.set('startForceAtlas2', 1);
                s.startForceAtlas2({
                    settings: {
                        drawEdges: false
                    }
                });
            } else {
                Session.set('startForceAtlas2', 0);
                s.stopForceAtlas2();
            };

        }
    });

    Template.container.rendered = function() {
        if (!this._rendered) {
            this._rendered = true;

            s = new sigma({
                container: 'graph-container',
                settings: {
                    drawEdges: true
                }
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
                        label: document.label,
                        size: document.size,
                        x: document.x,
                        y: document.y,
                        color: document.color
                    });
                } else {
                    updateNode(document);
                }

                s.refresh();
            }

            var dropNode = function(document) {
                if (hasNode(document.id)) {
                    s.graph.dropNode(document.id);
                    s.refresh();
                }
            }

            var updateNode = function(document) {
                if (hasNode(document.id)) {
                    var node = s.graph.nodes(document.id);
                    node.id = document.id;
                    node.label = document.label;
                    node.size = document.size;
                    node.x = document.x;
                    node.y = document.y;
                    node.color = document.color;
                    s.refresh();
                }
            }

            Nodes.find().observe({
                added: function(document) {
                    addNode(document);
                },
                removed: function(document) {
                    dropNode(document);
                },
                changed: function(document) {
                    updateNode(document);
                }
            });

            var hasEdge = function(id) {
                if (s.graph.edges(id) != null) {
                    return true;
                } else {
                    return false;
                }
            }

            var addEdge = function(document) {

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

                s.graph.addEdge({
                    id: document.id,
                    source: document.source,
                    target: document.target
                });

                s.refresh();
            }

            var dropEdge = function(document) {
                if (hasEdge(document.id)) {
                    s.graph.dropEdge(document.id);
                    s.refresh();
                }
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
                s.refresh();
            }

            Edges.find().observe({
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
}

if (Meteor.isServer) {
    Meteor.startup(function() {

        // code to run on server at startup
        Meteor.startup(function() {

            if (Nodes.find().count() === 0) {

                Nodes.insert({
                    id: 'n0',
                    label: 'Node0',
                    x: 100,
                    y: 0,
                    size: 0.1,
                    color: '#3ed877'
                });

                Nodes.insert({
                    id: 'n1',
                    label: 'Node1',
                    x: 200,
                    y: 100,
                    size: 0.1,
                    color: '#3ed877'
                });
            }

            if (Edges.find().count() === 0) {
                Edges.insert({
                    id: 'e01',
                    source: 'n0',
                    target: 'n1'
                });
            }

        });
    });
}