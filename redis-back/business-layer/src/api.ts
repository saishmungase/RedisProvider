import express from 'express';
import { z } from 'zod'
import { mailVarification } from './mail.js';
import { createInstance } from "@redis/service/root/manager.js"
import { validateCode } from './db.js';
import type { Request, Response, NextFunction } from 'express';

export const app = express();

const mailSchema = z.object({
  email : z.string().email()
});

const signUpSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  password: z.string().min(8),
  passcode: z.string()
});

const signInSchema = z.object({
  email : z.string().email(),
  password : z.string()
})

app.use(express.json());

/*

- signup (✅)
- signin (✅)
- signout (✅)
- create instance (✅)
- fetch instaces => Will Create After DB SETUP
- fetch instance => Will Create After DB SETUP
  ( usage, date )
- fetch instance data ( hashMaps & queues ) => Will Create After DB SETUP

*/

const verifyToken = (req : Request, res : Response, next : NextFunction) => {
  const {token} = req.body;
  console.log("Verfying Token....." + token)
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

app.post("/varified-signup", async (req, res) => {

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

  const isValid = await validateCode({ code: passcode, email });
  if(!isValid){
    return res.status(400).send({ message: "Invalid PassCode" });
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


app.post("/createInstance", verifyToken, async (req, res) => {
  const userData = req.body
  const { id, email, name } = userData;

  try {

    const { userId, containerId, port, password } = await createInstance({ userId : id, userName : name })

    console.log("Saving User Data To the Database")
    
    return res.send({
      status : 200,
      message : "Redis Instance Has Been Saved Successfully!"
    })

  } catch (error) {
    console.log( "Erro While Creating a Job:- " + error)
    return res.send({
      status : 500,
      message : "Internal Server Error !"
    })
  }
})