import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const database = new pg.Client({
  user : "postgres",
  host: "", // Enter your host name
  database: "", // Enter your Database name
  password: "", // Enter your password
  port: null, // Enter your port number for PostgreSQL
});

database.connect();

async function checkVisisted (){
  const countries = [];
  const data = await database.query("SELECT country_code FROM visited_countries");
  data.rows.forEach((country)=>{
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}

async function clearDatabase(){
  await database.query(
    "DELETE FROM visited_countries"
  );
}

clearDatabase();

app.get("/", async (req, res) => {
  //Write your code here.
  const countries =  await checkVisisted();
  res.render("index.ejs",{ 
    countries: countries, 
    total: countries.length 
  });
});

app.post("/add", async (req,res)=>{
  const new_country_name = req.body["country"];
  try{
    const new_code = await database.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'" ,
      [new_country_name.toLowerCase()]);
      const data = new_code.rows[0];
      const countryCode = data.country_code;
      try{
        await database.query("INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]);
        res.redirect("/");
      } catch(e){
        console.log(e.massage);
        const countries =  await checkVisisted();
        res.render("index.ejs",{ 
          countries: countries, 
          total: countries.length ,
          error : "Counrty Name is already added."
        });
      }
  } catch(e){
    console.log(e.massage);
    const countries =  await checkVisisted();
    res.render("index.ejs",{ 
      countries: countries, 
      total: countries.length,
      error : "Counrty Name does not exist."
    });
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});