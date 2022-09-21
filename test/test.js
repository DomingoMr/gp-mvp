
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { Instruction } = require("hardhat/internal/hardhat-network/stack-traces/model");
const { time } = require('@openzeppelin/test-helpers');
const { BN } = require('@openzeppelin/test-helpers');
const { promisify } = require('util');
const { web3 } = require("@nomiclabs/hardhat-web3");


describe("Token contract", function () {

    let instance;
    let owner;
    let comercio1;
    let comercio2;
    let usuario1;
    let usuario2;
    let usuario3;
    let usuario4;
    let usuario5;
    let usuario6;
    let usuario7;
    let usuario8;
    let usuario9;
    let usuario10;
    let usuario11;
    let initialSupply;
    let startTime;
    let endTime;


    beforeEach(async function () {
        token = await ethers.getContractFactory("GreenToken");
        [owner, comercio1, comercio2, usuario1, usuario2, usuario3, usuario4, usuario5, usuario6, usuario7, usuario8, usuario9, usuario10, usuario11] = await ethers.getSigners();
        tokenName = "GreenToken";
        tokenSymbol = "GEN";
        initialSupply = 1000;
        startTime = (await time.latest()).add(time.duration.hours(1));
        endTime = (await time.latest()).add(time.duration.days(2));



        instance = await upgrades.deployProxy(token, [tokenName, tokenSymbol]);

    })

    describe("Deployment", function () {

        it("Should set the right owner", async function () {

            expect(await instance.getOwner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {

            const ownerBalance = await instance.balanceOf(owner.address);
            expect(await instance.totalSupply()).to.equal(ownerBalance);
        });

        it("Should set the right duration", async function () {
            const days = 1;
            expect(await instance.durationTime()).to.equal(days);

        });

        it("Should set the right fees", async function () {

            expect(await instance.fees()).to.equal(30);

        });

        it("Should set the right stage", async function () {

            expect(await instance.stage()).to.equal(0);

        });

    });

    describe("Comercios", function () {
        it("Should create a Comercio", async function () {

            await instance.createComercio("Comercio1", comercio1.address);
            expect(await instance.balanceOf(comercio1.address)).to.equal(initialSupply);
            expect(await instance.balanceOf(owner.address)).to.equal(await instance.totalSupply() - initialSupply);

        });

        it("Should not create a Comercio if not Owner", async function () {

            await expect(instance.connect(comercio1).createComercio("Comercio1", comercio1.address)).to.be.reverted;
            await expect(instance.connect(usuario1).createComercio("Comercio1", comercio1.address)).to.be.reverted;

        });

        it("Should return all Comercios", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.createComercio("Comercio2", comercio2.address);
            var commerce = ["Comercio1", comercio1.address, ethers.BigNumber.from("0"), true];
            var commerce2 = ["Comercio2", comercio2.address, ethers.BigNumber.from("1"), true];
            var comercios = await instance.getComercios();

            expect(comercios[0][0]).to.equal(commerce[0]);
            expect(comercios[0][1]).to.equal(commerce[1]);
            expect(comercios[0][2]).to.equal(commerce[2]);
            expect(comercios[0][3]).to.equal(commerce[3]);

            expect(comercios[1][0]).to.equal(commerce2[0]);
            expect(comercios[1][1]).to.equal(commerce2[1]);
            expect(comercios[1][2]).to.equal(commerce2[2]);
            expect(comercios[1][3]).to.equal(commerce2[3]);
        });

        it("Should disable a commerce", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.createComercio("Comercio2", comercio2.address);
            await instance.disableComercio(comercio2.address, 1);

            var comercios = await instance.getComercios();
            expect(comercios[0][3]).to.equal(true);
            expect(comercios[1][3]).to.equal(false);
        });

        it("Should (disable a commerce) revert if not owner", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.connect(usuario1).disableComercio(comercio1.address, 0)).to.be.reverted;
        });

        it("Should (disable a commerce) revert if id no match", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.disableComercio(comercio1.address, 1)).to.be.reverted;
        });

        it("Should (disable a commerce) revert if it is already disabled", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            await expect(instance.disableComercio(comercio1.address, 0)).to.be.reverted;

        });

        it("Should activate a comercio", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            var comercios = await instance.getComercios();
            expect(comercios[0][3]).to.equal(false);
            await instance.activateComercio(comercio1.address, 0);
            var comercios2 = await instance.getComercios();
            expect(comercios2[0][3]).to.equal(true);


        });

        it("Should (activate a comercio) fail if not owner", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            await expect(instance.connect(comercio1).activateComercio(comercio1.address, 0)).to.be.reverted;
            await expect(instance.connect(usuario1).activateComercio(comercio1.address, 0)).to.be.reverted;
        });

        it("Should (activate a comercio) fail if already activated", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.activateComercio(comercio1.address, 0)).to.be.reverted;

        });

        it("Should (activate a comercio) fail if id not match", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            await expect(instance.activateComercio(comercio1.address, 1)).to.be.reverted;

        });

        it("Should add supply to Comercio", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addSupply(comercio1.address, 100);
            expect(await instance.balanceOf(comercio1.address)).to.equal(100 + initialSupply);
            expect(await instance.balanceOf(owner.address)).to.equal(await instance.totalSupply() - initialSupply - 100);
        });

        it("Should not add supply to Comercio if not Owner", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.connect(usuario1).addSupply(comercio1.address, 100)).to.be.reverted;

        });

        it("Should not add supply to Comercio if not active", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            await expect(instance.addSupply(comercio1.address, 100)).to.be.reverted;

        });

        it("Should give tokens for ecoaccion", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.connect(comercio1).ecoaccion(usuario1.address, 100);
            expect(await instance.balanceOf(usuario1.address)).to.equal(100);
        });

        it("Should not give tokens for ecoaccion if not participante", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.connect(comercio1).ecoaccion(usuario1.address, 100)).to.be.reverted;

        });

        it("Should not give tokens for ecoaccion if finished", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.connect(comercio1).ecoaccion(usuario1.address, 100);

            await time.advanceBlockTo(parseInt(await time.latestBlock()) + 5);

            await instance.finish();
            await expect(instance.connect(comercio1).ecoaccion(usuario1.address, 100)).to.be.reverted;

        });

        it("Should not let a no commerce to give tokens", async function () {
            await expect(instance.ecoaccion(usuario1.address, 100)).to.be.reverted;
            await expect(instance.connect(usuario10).ecoaccion(usuario1.address, 100)).to.be.reverted;

        });

        it("Should not let give tokens to a non active comercio", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.disableComercio(comercio1.address, 0);
            await expect(instance.ecoaccion(usuario1.address, 100)).to.be.reverted;

        });

        it("Should not give tokens for ecoaccion if not enough tokens", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await expect(instance.connect(comercio1).ecoaccion(usuario1.address, initialSupply + 10));

        });




    });


    describe("Usuarios", function () {

        it("Should transfer between users", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addSupply(comercio1.address, 10000);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 1000);
            await instance.connect(comercio1).ecoaccion(usuario2.address, 1000);
            await instance.connect(usuario1).transfer(usuario2.address, 300);

            expect(await instance.balanceOf(usuario1.address)).to.equal(1000 - 300);
            expect(await instance.balanceOf(usuario2.address)).to.equal(1000 + 300 * 70 / 100);

        });


        it("Should transfer between user and non registered", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addSupply(comercio1.address, 10000);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 1000);
            await instance.connect(usuario1).transfer(usuario2.address, 300)

            expect(await instance.balanceOf(usuario1.address)).to.equal(1000 - 300);
            expect(await instance.balanceOf(usuario2.address)).to.equal(300 * 70 / 100);

        });

        it("Should transfer aplicate fees", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addSupply(comercio1.address, 10000);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 1000);
            await instance.connect(comercio1).ecoaccion(usuario2.address, 1000);
            await instance.connect(usuario1).transfer(usuario2.address, 300)

            expect(await instance.balanceOf(owner.address)).to.equal(await instance.totalSupply() - initialSupply - 10000 + 300 * 30 / 100);

        });

        it("Should not transfer between users if finish", async function () {
            await instance.createComercio("Comercio1", comercio1.address);
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addSupply(comercio1.address, 10000);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 1000);
            await instance.connect(comercio1).ecoaccion(usuario2.address, 1000);
            await instance.connect(usuario1).transfer(usuario2.address, 300);

            await time.advanceBlockTo(parseInt(await time.latestBlock()) + 5);
            await instance.finish();
            await expect(instance.connect(usuario1).transfer(usuario2.address, 300));


        });

        it("Should set fees", async function () {
            await instance.setFees(10);
            expect(await instance.fees()).to.equal(10);
        });

        it("Should not set fees if not owner", async function () {
            await expect(instance.connect(usuario1).setFees(10)).to.be.reverted;

        });

        it("Should add a participante", async function () {
            await instance.addParticipante(usuario1.address, "usuario1");
            var participantes = await instance.getParticipantes();
            expect(participantes[0]).to.equal(usuario1.address);
        });

        it("Should not add a participante if not owner", async function () {
            await expect(instance.connect(usuario1).addParticipante(usuario1.address, "usuario1")).to.be.reverted;

        });


        it("Should returns participantes", async function () {
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addParticipante(usuario3.address, "usuario3");
            await instance.addParticipante(usuario4.address, "usuario4");
            var participantes = await instance.getParticipantes();
            expect(participantes[0]).to.equal(usuario1.address);
            expect(participantes[1]).to.equal(usuario2.address);
            expect(participantes[2]).to.equal(usuario3.address);
            expect(participantes[3]).to.equal(usuario4.address);

        });

    });

    describe("Concurso", function () {

        it("Should improve time", async function () {
            var days = 10;
            await instance.improveTime(days);
            expect(await instance.durationTime()).to.equal(1 + days);
        });

        it("Should not improve time if not owner", async function () {
            var days = 10;
            await expect(instance.connect(usuario1).improveTime(days));
        });

        it("Should return rest time", async function () {

            expect(await instance.timeRest()).to.equal(1);

        });

        it("Should change stage", async function () {
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.finish();
            expect(await instance.stage()).to.equal(1);

        });

        it("Should finish correctly", async function () {
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addParticipante(usuario3.address, "usuario3");
            await instance.addParticipante(usuario4.address, "usuario4");
            await instance.addParticipante(usuario5.address, "usuario5");
            await instance.addParticipante(usuario6.address, "usuario6");
            await instance.addParticipante(usuario7.address, "usuario7");
            await instance.addParticipante(usuario8.address, "usuario8");
            await instance.addParticipante(usuario9.address, "usuario9");
            await instance.addParticipante(usuario10.address, "usuario10");
            await instance.addParticipante(usuario11.address, "usuario11");

            await instance.createComercio("Comercio1", comercio1.address);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 25);
            await instance.connect(comercio1).ecoaccion(usuario2.address, 3);
            await instance.connect(comercio1).ecoaccion(usuario3.address, 1);
            await instance.connect(comercio1).ecoaccion(usuario4.address, 50);
            await instance.connect(comercio1).ecoaccion(usuario5.address, 13);
            await instance.connect(comercio1).ecoaccion(usuario6.address, 36);
            await instance.connect(comercio1).ecoaccion(usuario7.address, 44);
            await instance.connect(comercio1).ecoaccion(usuario8.address, 49);
            await instance.connect(comercio1).ecoaccion(usuario9.address, 16);
            await instance.connect(comercio1).ecoaccion(usuario10.address, 5);

            console.log("Usuario1: ", usuario1.address);
            console.log("Balance: ", await instance.balanceOf(usuario1.address));
            console.log("Usuario2: ", usuario2.address);
            console.log("Balance: ", await instance.balanceOf(usuario2.address));
            console.log("Usuario3: ", usuario3.address);
            console.log("Balance: ", await instance.balanceOf(usuario3.address));
            console.log("Usuario4: ", usuario4.address);
            console.log("Balance: ", await instance.balanceOf(usuario4.address));
            console.log("Usuario5: ", usuario5.address);
            console.log("Balance: ", await instance.balanceOf(usuario5.address));
            console.log("Usuario6: ", usuario6.address);
            console.log("Balance: ", await instance.balanceOf(usuario6.address));
            console.log("Usuario7: ", usuario7.address);
            console.log("Balance: ", await instance.balanceOf(usuario7.address));
            console.log("Usuario8: ", usuario8.address);
            console.log("Balance: ", await instance.balanceOf(usuario8.address));
            console.log("Usuario9: ", usuario9.address);
            console.log("Balance: ", await instance.balanceOf(usuario9.address));
            console.log("Usuario10: ", usuario10.address);
            console.log("Balance: ", await instance.balanceOf(usuario10.address));
            console.log("Usuario11: ", usuario11.address);
            console.log("Balance: ", await instance.balanceOf(usuario11.address));

            console.log("Participantes: ", await instance.getParticipantes());

            var ganadoresTest = [usuario4.address, usuario8.address, usuario7.address, usuario6.address,
            usuario1.address, usuario9.address, usuario5.address, usuario10.address, usuario2.address,
            usuario3.address];
            await instance.finish();
            var ganadores = await instance.winners();
            console.log("Ganadores", ganadores);

            expect(ganadores[0]).to.equal(ganadoresTest[0]);
            expect(ganadores[1]).to.equal(ganadoresTest[1]);
            expect(ganadores[2]).to.equal(ganadoresTest[2]);
            expect(ganadores[3]).to.equal(ganadoresTest[3]);
            expect(ganadores[4]).to.equal(ganadoresTest[4]);
            expect(ganadores[5]).to.equal(ganadoresTest[5]);
            expect(ganadores[6]).to.equal(ganadoresTest[6]);
            expect(ganadores[7]).to.equal(ganadoresTest[7]);
            expect(ganadores[8]).to.equal(ganadoresTest[8]);
            expect(ganadores[9]).to.equal(ganadoresTest[9]);




        });

        it("Should finish correctly with less than 10 participants", async function () {
            await instance.addParticipante(usuario1.address, "usuario1");
            await instance.addParticipante(usuario2.address, "usuario2");
            await instance.addParticipante(usuario3.address, "usuario3");
            await instance.addParticipante(usuario4.address, "usuario4");
            await instance.addParticipante(usuario5.address, "usuario5");


            await instance.createComercio("Comercio1", comercio1.address);
            await instance.connect(comercio1).ecoaccion(usuario1.address, 25);
            await instance.connect(comercio1).ecoaccion(usuario2.address, 3);
            await instance.connect(comercio1).ecoaccion(usuario3.address, 1);
            await instance.connect(comercio1).ecoaccion(usuario4.address, 50);
            await instance.connect(comercio1).ecoaccion(usuario5.address, 13);


            console.log("Usuario1: ", usuario1.address);
            console.log("Balance: ", await instance.balanceOf(usuario1.address));
            console.log("Usuario2: ", usuario2.address);
            console.log("Balance: ", await instance.balanceOf(usuario2.address));
            console.log("Usuario3: ", usuario3.address);
            console.log("Balance: ", await instance.balanceOf(usuario3.address));
            console.log("Usuario4: ", usuario4.address);
            console.log("Balance: ", await instance.balanceOf(usuario4.address));
            console.log("Usuario5: ", usuario5.address);
            console.log("Balance: ", await instance.balanceOf(usuario5.address));

            console.log("Participantes: ", await instance.getParticipantes());

            var ganadoresTest = [usuario4.address, usuario1.address, usuario5.address, usuario2.address,
            usuario3.address];
            await instance.finish();
            var ganadores = await instance.winners();
            console.log("Ganadores", ganadores);
            console.log("GanadoresTest", ganadoresTest);

            expect(ganadores[0]).to.equal(ganadoresTest[0]);
            expect(ganadores[1]).to.equal(ganadoresTest[1]);
            expect(ganadores[2]).to.equal(ganadoresTest[2]);
            expect(ganadores[3]).to.equal(ganadoresTest[3]);
            expect(ganadores[4]).to.equal(ganadoresTest[4]);
            expect(ganadores[5]).to.equal("0x0000000000000000000000000000000000000000");




        });


        it("Should not finish if not participantes", async function () {
            expect(instance.finish()).to.be.reverted;

        });

        it("Should no return winners if not finish", async function () {
            expect(instance.winners()).to.be.reverted;

        });







    });


});


//Anotaciones: testear que un usuario con tokens pero que no es participante no participa