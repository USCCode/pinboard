'''
Pinboard : a CSCE 242 project.
Created on May 16, 2012
www.csce242.com

@author: Jose M Vidal <jmvidal@gmail.com>

Homework 4
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
    private = db.BooleanProperty(default=False)

    def id(self):
        return self.key().id()
    
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
        
    def getPin(self, id):
        """Returns the pin with the given id (a String), or None if there is no such id."""
        key = db.Key.from_path('Pin', long(id))
        logging.info('key is=%s' % key)
        thePin = db.get(key)
        if thePin == None:
            self.redirect('/')
            return None
        return thePin        

class MainPageHandler(myHandler):
    def get(self): #Ask user to login or show him add pins form.
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
        if id == '': # GET /pin returns the list of pins for this user
            query = Pin.all().filter('owner =', self.user) #Remember: "owner=" won't work!!!
            logging.info("user=%s" % self.user)
            for p in query:
                logging.info(p.imgUrl)
            self.templateValues['pins'] = query
            self.templateValues['title'] = 'Your Pins'
            self.render('pinlist.html')
            return
        thePin = self.getPin(id)
        if thePin == None: return
        logging.info('thepin.private is=%s' % thePin.private)
        if (not thePin.private) or self.user == thePin.owner:
            self.templateValues['pin'] = thePin
            self.templateValues['id'] = id
            self.templateValues['title'] = id
            self.render('pin.html')
        else:
            self.redirect('/')
    
    def post(self,id):
        """If /pin/ then create a new one, if /pin/123 then update it,
        if /pin/123?cmd=delete then delete it."""
        self.setupUser()
        imgUrl = self.request.get('imgUrl')
        caption = self.request.get('caption')
        command = self.request.get('cmd')
        private = self.request.get('private')
        if private == "on":
            private = True
        else:
            private = False
        owner = self.user
        if id == '': #new pin, create it
            thePin = Pin(imgUrl = imgUrl, caption = caption, owner = owner, private = private)
            thePin.put()
        else:
            thePin = self.getPin(id)
            if thePin == None: return            
            if thePin.owner != self.user: #not his pin, kick him out.
                self.redirect('/')
                return
            if command == 'delete': #delete the pin
                thePin.delete()
                self.redirect('/pin/')            
                return
            else: #existing pin, update it 
                thePin.imgUrl = imgUrl
                thePin.caption = caption
                thePin.private = private
                thePin.put()
        key = thePin.key()
        newUrl = '/pin/%s' % key.id()
        logging.info('Going to ' + newUrl)
        self.redirect(newUrl)


app = webapp2.WSGIApplication([('/pin/(.*)', PinHandler), ('/pin()', PinHandler),
                               ('/', MainPageHandler)],
                              debug=True)
