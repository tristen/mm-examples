(function(context) {

  var Docs = function() {};

  Docs.prototype = {

    queryExamples: function () {
      var data = false;
      var search = $('#search');
      var tExamples = _.template($('#examples').html());
      var tags = [];

      var fullResult = $.ajax({
        url: 'search.json',
        dataType: 'json',
        success: function(r) {
          _.delay(function () {tagList(tags)}, 10);
          _.each(r, function(result){
            $('#results').append(tExamples(result));
            tags.push(result.tags);
          });
        }
      });

      var tagList = function (tags) {
        var tTags = _.template($('#tags').html());
        var t = _(tags).chain()
          .flatten(tags)
          .uniq(tags)
          .compact(tags)
          .value();
        _.each(t, function(tag) {
          $('#tag-list').append(tTags({'tag': tag}));
        });

        _.delay(function () {
          $('#tag-list').find('a').on('click', tagFilter);
        }, 1);

        var tagFilter = function(e) {
          e.preventDefault();
          $('#results').empty();
          var tag = $(this).attr('data-tag');

          if (!$(this).hasClass('active')) {
            $('#tag-list').find('a').removeClass('active');
            $(this).addClass('active');

            var matches = find(tag.toLowerCase().match(/(\w+)/g));
            _(matches).each(function(p) {
              $('#results').append(tExamples(p));
            });
          } else {
            $(this).removeClass('active');
            $.ajax({
              url: 'search.json',
              dataType: 'json',
              success: function(r) {
                _.each(r, function(result){
                  $('#results').append(tExamples(result));
                });
              }
            });
          }
        }
      }

      var find = function(phrase) {
        if (!data) return $.ajax({
          url: 'search.json',
          dataType: 'json',
          success: function(r) {
            data = _(r).chain()
              .compact()
              .map(function(r) {
                r.words = (r.title.toLowerCase() + ' ' + (r.tags.toString()).toLowerCase()).match(/(\w+)/g);
                return r;
              })
              .value();
            find(phrase);
          }
        });

        var matches = _(data).filter(function(p) {
          return _(phrase).filter(function(a) {
            return _(p.words).any(function(b) {
              return a === b || b.indexOf(a) === 0;
            });
          }).length === phrase.length;
        });

        return matches;
      };

      $('input', search).keyup(_(function() {

        $('#results').empty();
        var phrase = $('input', search).val();

        if (phrase.length >= 2) {
          var matches = find(phrase.toLowerCase().match(/(\w+)/g));
          _(matches).each(function(p) {
            $('#results').append(tExamples(p));
          });
          if (matches.length) return;
        } else {
          $.ajax({
            url: 'search.json',
            dataType: 'json',
            success: function(r) {
              _.each(r, function(result){
                $('#results').append(tExamples(result));
              });
            }
          });
        }

        return false;
      }).debounce(100));
    },

    getGist: function(hash) {
      var that = this;
      var request = 'https://api.github.com/gists/' + hash;
      var tSnippets = _.template($('#snippets').html());
      var tToc = _.template($('#directory-listing').html());

      $.ajax({
        url: request,
        dataType: 'json',
        success: function(data) {
          var f = {};
          _.each(data.files, function(files) {

            // Build a new object out of results
            f.name = files.filename;
            f.content = files.content;
            f.fileId = files.filename.split('.')[0];

            // Send data to our template
            $('#code-examples').append(tSnippets(f));
            $('#toc').append(tToc(f));

          });
          // Syntax Highlighting
          prettyPrint();

          // Animate scrolling down the document when toc links are clicked.
          $('#toc').find('a').on('click', that.animateScrolling);
        }
      });
    },

    isTouchDevice: function() {
      return 'ontouchstart' in window;             
    },

    animateScrolling: function(e) {
      e.preventDefault();
      var a = $(e.target).attr('href');
      $('body,html').animate({ scrollTop: $(a).offset().top }, 500);
    },

    fixedSidebar: function() {
      var nav = $('.sidebar-inner');
      var that = this;

      if (!nav || !nav.length) return;
      var top = nav.offset().top - parseFloat(nav.css('marginTop').replace(/auto/, 0));
      $(window).scroll(function (e) {
        if (!that.isTouchDevice()) {
          var y = $(this).scrollTop();
          if (y >= top) {
            nav.addClass('fixed');
          } else {
            nav.removeClass('fixed');
          }
        }
      });    
    }
  };

window.Docs = Docs;
})(window);
