package com.manish.orgcheszer;

import javafo.api.JaVaFoApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class OrgcheszerApplication {
	public static void main(String[] args) {
		SpringApplication.run(OrgcheszerApplication.class, args);
	}
}
