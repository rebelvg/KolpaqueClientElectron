import React from 'react';
import {Link} from 'react-router-dom';

import './style.css';

const About = () => (
    <div className="container">
        <p>Lorem Ipsum another Page</p>
        <Link to="/">Home</Link>
    </div>
);

export default About;
