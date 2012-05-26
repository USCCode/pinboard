'''
Pinboard : a CSCE 242 project.
Created on May 16, 2012
www.csce242.com

@author: Jose M Vidal <jmvidal@gmail.com>

Homework 3
'''
import webapp2
import jinja2
import os
import logging #for debugging.
from google.appengine.api import users
from google.appengine.ext import db

jinja_environment = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.dirname(__file__) + "/templates"))

class Pin(db.Model):
    imgUrl = db.StringProperty()
    caption = db.StringProperty()
    date = db.DateTimeProperty(auto_now_add=True)
    owner = db.UserProperty()
    
class myHandler(webapp2.RequestHandler):
    "Setup self.user and self.templateValues values."
    def setupUser(self):
        self.user = users.get_current_user()
        self.templateValues = {}
        if self.user:
            self.templateValues['logout'] = users.create_logout_url('/')
            self.templateValues['username'] = self.user.nickname()
        else:
            self.templateValues['login'] = users.create_login_url('/')
            
    def render(self, file):
        "Render the given file"
        template = jinja_environment.get_template(file)
        self.response.out.write(template.render(self.templateValues))

class MainPageHandler(myHandler):
    def get(self):
        self.setupUser()
        if self.request.get('imgUrl') != None:
            self.templateValues['imgUrl'] = self.request.get('imgUrl')
        if self.request.get('caption') != None:
            self.templateValues['caption'] = self.request.get('caption')
        self.templateValues['title'] = 'Pinboard'
        self.render('main.html')
        
        
class PinHandler(myHandler):
    def get(self,id):
        self.setupUser()
        logging.info('id is=%s' % id)
        key = db.Key.from_path('Pin', long(id))
        logging.info('key is=%s' % key)
        thePin = db.get(key)
        if thePin == None:
            self.redirect('/')
            return
        self.templateValues['title'] = id
        self.templateValues['id'] = id
        self.templateValues['imgUrl'] = thePin.imgUrl
        self.templateValues['caption'] = thePin.caption
        self.render('pin.html')
    
    def post(self,id):
        """If /pin/ then create a new one, if /pin/123 then update it."""
        self.setupUser()
        imgUrl = self.request.get('imgUrl')
        caption = self.request.get('caption')
        owner = self.user
        thePin = Pin(imgUrl = imgUrl, caption = caption, owner = owner)
        thePin.put()
        key = thePin.key()
        newUrl = '/pin/%s' % key.id()
        logging.info('Going to ' + newUrl)
        self.redirect(newUrl)



app = webapp2.WSGIApplication([('/pin/(.*)', PinHandler),
                               ('/', MainPageHandler)],
                              debug=True)
