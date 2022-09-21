//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GreenToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    address private _owner;
    uint256 private _totalSupply;
    uint256 private _initialSupply;
    uint256 private _comercioId;
    uint256 private _participanteId;
    uint256 public durationTime;
    uint256 public startDate;
    uint8 public fees;

    struct Comercio {
        string nombre;
        address wallet;
        uint256 id;
        bool activo;
    }

    enum Stages {
        EnCurso,
        Finalizado
    }

    Stages public stage;

    Comercio[] private vectorComercios;
    mapping(address => Comercio) private wallet2comercio;
    address[] private participantes;
    mapping(address => string) private participante2email;
    address[10] private _whitelist;

    function initialize(string memory tokenName, string memory tokenSymbol)
        external
        initializer
    {
        __ERC20_init(tokenName, tokenSymbol);
        __Ownable_init();
        _owner = msg.sender;
        _totalSupply = 1000000000;
        _mint(_owner, _totalSupply);
        _comercioId = 0;
        _participanteId = 0;
        _initialSupply = 1000;
        stage = Stages.EnCurso;
        startDate = block.timestamp;
        durationTime = 1 seconds;
        fees = 30;
    }

    //***************************Funciones relativas a los comercios***************************//
    //Crear comercio
    function createComercio(string memory name, address comercio)
        public
        onlyOwner
    {
        Comercio memory newComercio = Comercio(
            name,
            comercio,
            _comercioId,
            true
        );
        wallet2comercio[comercio] = newComercio;
        vectorComercios.push(newComercio);
        _comercioId++;

        _transfer(_owner, comercio, _initialSupply);
    }

    //Dehsabilitar el comercio para que no pueda seguir repartiendo tokens
    function disableComercio(address comercio, uint256 id) public onlyOwner {
        require(
            wallet2comercio[comercio].id == id,
            "No coincide la wallet con el id del comercio"
        );
        require(
            wallet2comercio[comercio].activo,
            "El comercio ya esta deshabilitado"
        );

        wallet2comercio[comercio].activo = false;
        vectorComercios[id].activo = false;

        _transfer(comercio, _owner, _initialSupply);
    }

    //Vuelve a activar un comercio que habia sido deshabilitado
    function activateComercio(address comercio, uint256 id) public onlyOwner {
        require(
            wallet2comercio[comercio].id == id,
            "No coincide la wallet con el id del comercio"
        );
        require(
            !wallet2comercio[comercio].activo,
            "El comercio ya esta activo"
        );

        wallet2comercio[comercio].activo = true;
        vectorComercios[id].activo = true;

        _transfer(_owner, comercio, _initialSupply);
    }

    //Añade mas tokens al comercio
    function addSupply(address comercio, uint256 amount) public onlyOwner {
        require(wallet2comercio[comercio].activo, "El comercio no esta activo");
        _transfer(_owner, comercio, amount);
    }

    //Transfiere los tokens a los usuarios
    function ecoaccion(address ecoactor, uint256 amount) public {
        require(
            wallet2comercio[msg.sender].activo,
            "Lo sentimos, la transaccion puede ser aprobada unicamente por un comercio activo"
        );
        require(
            balanceOf(msg.sender) >= amount,
            "No dispone de suficientes tokens. Solicite mas."
        );
        require(
            keccak256(abi.encodePacked(participante2email[ecoactor])) !=
                keccak256(abi.encodePacked("")),
            "El usuario no es un participante"
        );

        require(stage == Stages.EnCurso, "La clasificacion ya ha finalizado");
        _transfer(msg.sender, ecoactor, amount);
    }

    //Imprime los comercios
    function getComercios() public view returns (Comercio[] memory) {
        return vectorComercios;
    }

    //***********************************************Funcion relativa a los usuarios*********************************/
    //Transferencia de tokens entre usuarios
    //Podria restringir la transferencia unicamente entre usuarios de la aplicacion,
    //pero no lo voy a hacer ya que voy a dar la posibiklidad de que quien quiera se
    //gestione sus cuentas y pueda enviar tokens a otras billeteras.
    function transfer(address to, uint256 amount)
        public
        override
        returns (bool)
    {
        require(stage == Stages.EnCurso, "La clasificacion ya ha finalizado");
        address owner = msg.sender;
        uint256 reduction = (amount * fees) / 100;
        uint256 transferAmount = amount - reduction;

        _transfer(owner, _owner, reduction);
        _transfer(owner, to, transferAmount);
        return true;
    }

    //Permite modificar las fees en las transacciones entre usuarios
    function setFees(uint8 newFee) public onlyOwner {
        fees = newFee;
    }

    //Anadir participante con address e email. Esto nos permite ordenar a los ganadores de forma mas facil
    function addParticipante(address participante, string memory email)
        public
        onlyOwner
    {
        participantes.push(participante);
        participante2email[participante] = email;
        _participanteId++;
    }

    //Imprime los participantes al grupo
    function getParticipantes() public view returns (address[] memory) {
        return participantes;
    }

    //************************************Funciones relativas a la finalizacion de la clasificacion **************************/
    //Aumenta el tiempo de la clasificacion
    function improveTime(uint256 time) public onlyOwner {
        //time = time * 1 days;
        durationTime = durationTime + time;
    }

    //Indica cuanto tiempo queda de concurso
    function timeRest() public view returns (uint256) {
        return startDate + durationTime - block.timestamp;
    }

    //Para terminar el concurso, la implementacion en el ejemplo 3_statemachine me parece muy interesante, sin embargo si tengo que usar ese modificador
    //para cada transacción gastaría mucho gas. Por ello voy a implementar una opción a la que tenga que llamar yo
    function finish() public onlyOwner {
        require(
            block.timestamp >= startDate + durationTime,
            "La clasificacion aun no ha terminado"
        );
        require(participantes.length >= 1, "No hay participantes");
        stage = Stages.Finalizado;
        _whitelist = order();
    }

    function winners() public view returns (address[10] memory) {
        require(
            stage == Stages.Finalizado,
            "Aun no tenemos la lista de ganadores"
        );

        return _whitelist;
    }

    //Ordena los 10 primeros usuarios con mayor balance
    function order() internal virtual returns (address[10] memory) {
        address[10] memory ganadores;
        address[] memory clasificacion = participantes;
        uint256 index;
        uint256 max;

        for (uint8 j = 0; j <= 9; j++) {
            max = 0;
            index = 0;
            for (uint256 i = 0; i < clasificacion.length; i++) {
                if (balanceOf(clasificacion[i]) >= max) {
                    max = balanceOf(clasificacion[i]);
                    index = i;
                }
            }

            ganadores[j] = clasificacion[index];
            clasificacion[index] = address(0);
        }

        return ganadores;
    }

    function getOwner() public view returns (address) {
        return _owner;
    }

    //Duda: porque en el erc20 de openzeppelin las funciones de _transfer y tal son virtual si cambian la blockchain

    //Anotaciones:  cambiar ecoacciones para que solo puedan participantes
}
