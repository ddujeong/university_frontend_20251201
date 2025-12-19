import React from "react";
import "./Hero.css";
const Hero = () => (
  <section className="hero">
    <img src="/img/campus.png" alt="학교 전경" className="hero__img" />
    <div className="hero__overlay">
      <h1 className="hero__title">누리 대학교에 오신 것을 환영합니다</h1>
      <p className="hero__subtitle">
        최고의 교육과 다양한 활동으로 여러분을 기다립니다.
      </p>
    </div>
  </section>
);

export default Hero;
