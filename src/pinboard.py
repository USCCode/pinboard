'''
Created on May 16, 2012

@author: jmvidal
'''
import webapp2
import jinja2
import os

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

class MainPage(webapp2.RequestHandler):
    def get(self):
        templateValues = {}
        if self.request.get('img-url') != None:
            templateValues['img-url'] = self.request.get('img-url') 
        template = jinja_environment.get_template('main.html')
        self.response.out.write(template.render(templateValues))

app = webapp2.WSGIApplication([('/', MainPage)],
                              debug=True)
