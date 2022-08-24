import React, { useState, useEffect } from "react";
import axios from "axios";

const MODE_REGISTER = "Register";
const MODE_LOGIN = "Login";

// componenet to handle login of an existing user or registration of a new one
function RestLoginOrRegister(props) {
  // REGISTER FUNCTION hits a register endppint on backend providing a username and email in the body, stuill need to addd cuntionality for email and various other detail
  function register() {
    console.log("email", formState.email, "username", formState.username);

    // checks to see if emails match and tehn hits endpoint to register a new user
    axios({
      method: "POST",
      data: {
        username: formState.username,
        email: formState.email,
        password: formState.password,
      },
      withCredentials: true,
      url: "http://localhost:3000/restaurants/register",
    }).then((res) => {
      console.log(res);

      props.setCount("activeOrderTable");
    });
  }

  // LOGIN FUNCTION hits restaurant login endpoint on backend providing a username ans email for authentication, still need to provide an email option as well
  function login() {
    console.log("email", formState.email, "username", formState.username);

    // checks to see if emails match, if they do wi9ll hit login endpoint and log the user in

    axios({
      method: "POST",
      data: {
        username: formState.username,
        email: formState.email,
        password: formState.password,
      },
      withCredentials: true,
      url: "http://localhost:3000/restaurants/login",
    }).then((res) => {
      console.log(res);
      props.setCount("activeOrderTable");
    });
  }

  //usestate controlling the state of all inputs on login or register pages, also controls buttons and functions hit between if the user wants to register or login
  const [formState, setFormState] = useState({
    mode: MODE_REGISTER,
    username: "",
    email: "",
    password: "",
    logState: "false",
  });

  function handleChange(event) {
    const newValue = event.target.value;
    const inputName = event.target.name;

    setFormState({
      ...formState,
      [inputName]: newValue,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    //controls the state as login ro register passing a different function depending on the chosen preference
    switch (formState.mode) {
      case MODE_LOGIN:
        login();
        // code block
        break;
      case MODE_REGISTER:
        register();
        // code block
        break;
      default:
        register(); // defaulted to register
      // code block
    }
    console.log("from state", formState);
  }

  // switches the desired mode between login or register, what happens here will trigger the above switch statement accordingly
  function switchMode() {
    setFormState({
      ...formState,
      mode: formState.mode === MODE_REGISTER ? MODE_LOGIN : MODE_REGISTER,
    });
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      console.log("mounted register page");
    }
  }, []);

  // renders the login or register page
  return (
    <div state={formState.logState}>
      <form onSubmit={handleSubmit}>
        <h1>{formState.mode === MODE_REGISTER ? MODE_REGISTER : MODE_LOGIN}</h1>
        <input
          name="username"
          onChange={handleChange}
          placeholder="username"
          value={formState.username}
          label="email"
        ></input>
        <input
          name="email"
          onChange={handleChange}
          placeholder="email"
          value={formState.email}
          label="email"
        ></input>
        <input
          name="password"
          onChange={handleChange}
          placeholder="password"
          value={formState.password}
          label="email"
        ></input>
        <button type="submit">
          <h3>{formState.mode}</h3>
        </button>
      </form>
      <button name="login-or-register" onClick={switchMode}>
        <h3>
          Switch to{" "}
          {formState.mode === MODE_REGISTER ? MODE_LOGIN : MODE_REGISTER}
        </h3>
      </button>
    </div>
  );
}

export default RestLoginOrRegister;
