import express from 'express';
import { email, z } from 'zod'
import { mailVarification } from './mail.js';
import { validate } from 'uuid';
import { validateCode } from './db.js';

export const app = express();

const mailSchema = z.object({
  email : z.email
});

const signUpSchema = z.object({
  name : z.string,
  age : z.number,
  email : z.email,
  password : z.string,
  passcode : z.string
})

const signInSchema = z.object({
  email : z.email,
  password : z.string
})

app.use(express.json());

/*

- signup (✅)
- signin (✅)
- signout (✅)
- create instance
- fetch instaces
- fetch instance 
  ( usage, date )
- fetch instance data ( hashMaps & queues )

*/

const verifyToken = (req : , res, next) => {
  const {toekn} = req.body;
  console.log("Verfying Token.....")
  next();
}

app.post("/signup", async (req, res) => {
    const data = req.body; 
    const parseResult = mailSchema.safeParse(data);

    if(!parseResult.success){
      res.send({
        status : 400,
        message : "Invalid Credentials"
      });
      return;
    }
    
    const {email} = data;
    const mailState = await mailVarification(email);

    if(mailState.status == "error-mail"){
      return res.send({
        status : 400,
        message : "Error While Sending Code, Please Try Later or use different mail id"
      })
    }

    return res.send({
      status : 200,
      message : "Code is Being Shared To Your Mail Id Please Check!"
    })
    
})

app.post("/varified-signup", (req, res) => {

  const data = req.body; 

  const parseResult = signUpSchema.safeParse(data);

  if(!parseResult.success){
    res.send({
      status : 400,
      message : "Invalid Credentials"
    });
    return;
  }

  const {name, age, email, password, passcode} = data;

  if(!validateCode({ code : passcode, email })){
    return res.send({
      status : 400,
      message : "Please Enter a Valid PassCode"
    })
  }

  console.log("DatBase will be integrated soon, For right now Data Saved Successfully")

  res.send({
    status : 200,
    token : 99,
    message : "Data is being Stored Successfully!"
  })
})

app.post("/login", (req, res) => {
  const data = req.body;
  const parseResult = signInSchema.safeParse(data);

  const { email, password } = data;

  console.log("Checking DB......")

  res.send({
    status : 200,
    token : 99,
    message : "It's Good To See You Again!"
  })
})


// app.post("/createInstance", verifyToken, async (req, res) => {
//   const userData = req.body
//   const { id, email, name } = userData;

//   try {

//     const instance = createInstance({ userId : id, userName : name })

//     console.log("Updating User Data On The DB ( " + id + ", " + email + " )")

//   } catch (error) {
    
//   }
  
// })