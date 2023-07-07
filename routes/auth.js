const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const influx_client = require("../config/influxdb").getClient();


router.post("/signup", [check("email").isEmail()], async (req, res) => {
  const { password, email } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  let existingUses;
  try {
    existingUses = await User.findOne({ email: email });
  } catch (e) {
    console.log("error in finding user");
  }
  if (existingUses) {
    res
      .json({ error: "User of this email already exists", success: false });
    return null;
  }
  const createduser = new User({
    email,
    password:hashedPassword,
  });
  try {
    createduser.save();
    console.log("user added");
    const token = await jwt.sign({ email }, "weather", {expiresIn: 360000});
    res.status(201).json({
      userid: createduser.id,
      email: createduser.email,
      token: token,
      success: true,
    });
  } catch (e) {
    console.log("Error in signup");
  }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    
    let existingUses;
    try {
      existingUses = await User.findOne({ email: email });
    } catch (e) {
      console.log("error in finding user");
    }
   
    if(!existingUses) {
        return res.json({success: false, msg:"User not found"});
    }

    let isMatch = await bcrypt.compare(password, existingUses.password);

    if(!isMatch){
        return res.json({
            
                    msg: "Invalid Credentials" ,success: false
                
        })
    }

    const token = await jwt.sign({email}, "weather", {expiresIn: 360000})

    res.json({
        token , success: true
    })
})

router.get('/weatherdata', async(req, res) => {

  try {
    const result = await influx_client.query(`
            select * from weather ORDER BY time DESC LIMIT 1
        `);
    // console.table(result);
    console.log(result[0].humidity);
    console.log(result[0].temperature);
    console.log("Get route called")
    res.send({success: true, temp:result[0].temperature, humidity:result[0].humidity})
  } catch (error) {
    console.log("Error");
    return res.send({success: false, error: "Cant retrieve data from influx database"});
  }
    
});






router.get("/all", (req, res) => {
  res.send({ users: users });
});

module.exports = router;
