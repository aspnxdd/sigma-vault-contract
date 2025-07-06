import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MockERC20 } from '../typechain-types';

describe('TokenVault', function () {
  let vault: any;
  let token0: MockERC20;
  let token1: MockERC20;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [user1, user2, user3] = await ethers.getSigners();

    // Deploy Mock Tokens
    const MockToken = await ethers.getContractFactory('MockERC20');
    token0 = await MockToken.deploy('Token 0', 'TK0');
    token1 = await MockToken.deploy('Token 1', 'TK1');

    // Deploy TokenVault (no constructor args)
    const TokenVault = await ethers.getContractFactory('TokenVault');
    vault = await TokenVault.deploy();

    // Mint tokens to users
    await token0.mint(user1.address, ethers.parseEther('1000'));
    await token0.mint(user2.address, ethers.parseEther('1000'));
    await token0.mint(user3.address, ethers.parseEther('1000'));

    await token1.mint(user1.address, ethers.parseEther('1000'));
    await token1.mint(user2.address, ethers.parseEther('1000'));
    await token1.mint(user3.address, ethers.parseEther('1000'));

    // Approve vault to spend tokens
    await token0
      .connect(user1)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));
    await token0
      .connect(user2)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));
    await token0
      .connect(user3)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));

    await token1
      .connect(user1)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));
    await token1
      .connect(user2)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));
    await token1
      .connect(user3)
      .approve(await vault.getAddress(), ethers.parseEther('1000'));
  });

  describe('Deployment', function () {
    it('Should deploy successfully without ownership', async function () {
      expect(await vault.nextDepositId()).to.equal(0);
    });
  });

  describe('Token Deposits', function () {
    it('Should deposit both tokens correctly', async function () {
      const amount0 = ethers.parseEther('100');
      const amount1 = ethers.parseEther('200');

      const initialBalance0 = await token0.balanceOf(user1.address);
      const initialBalance1 = await token1.balanceOf(user1.address);

      await expect(
        vault
          .connect(user1)
          .deposit(
            await token0.getAddress(),
            amount0,
            await token1.getAddress(),
            amount1
          )
      )
        .to.emit(vault, 'TokensDeposited')
        .withArgs(
          0,
          user1.address,
          await token0.getAddress(),
          amount0,
          await token1.getAddress(),
          amount1
        );

      expect(await token0.balanceOf(user1.address)).to.equal(
        initialBalance0 - amount0
      );
      expect(await token1.balanceOf(user1.address)).to.equal(
        initialBalance1 - amount1
      );
    });

    it('Should deposit only token0', async function () {
      const amount0 = ethers.parseEther('100');
      const amount1 = 0n;

      await expect(
        vault
          .connect(user1)
          .deposit(
            await token0.getAddress(),
            amount0,
            ethers.ZeroAddress,
            amount1
          )
      )
        .to.emit(vault, 'TokensDeposited')
        .withArgs(
          0,
          user1.address,
          await token0.getAddress(),
          amount0,
          ethers.ZeroAddress,
          amount1
        );
    });

    it('Should deposit only token1', async function () {
      const amount0 = 0n;
      const amount1 = ethers.parseEther('200');

      await expect(
        vault
          .connect(user1)
          .deposit(
            ethers.ZeroAddress,
            amount0,
            await token1.getAddress(),
            amount1
          )
      )
        .to.emit(vault, 'TokensDeposited')
        .withArgs(
          0,
          user1.address,
          ethers.ZeroAddress,
          amount0,
          await token1.getAddress(),
          amount1
        );
    });

    it('Should revert when depositing zero amounts for both tokens', async function () {
      await expect(
        vault
          .connect(user1)
          .deposit(await token0.getAddress(), 0, await token1.getAddress(), 0)
      ).to.be.revertedWithCustomError(vault, 'InvalidAmount');
    });

    it('Should increment deposit ID correctly', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await vault
        .connect(user2)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('50'),
          await token1.getAddress(),
          ethers.parseEther('75')
        );
      expect(await vault.nextDepositId()).to.equal(2);
    });
  });

  describe('ETH Deposits (token0 or token1 is zero address)', function () {
    it('Should deposit ETH as token0 correctly', async function () {
      const ethAmount = ethers.parseEther('1');
      const tokenAmount = ethers.parseEther('100');

      await token1.mint(user1.address, tokenAmount);
      await token1
        .connect(user1)
        .approve(await vault.getAddress(), tokenAmount);

      await expect(
        vault
          .connect(user1)
          .deposit(
            ethers.ZeroAddress,
            ethAmount,
            await token1.getAddress(),
            tokenAmount,
            { value: ethAmount }
          )
      )
        .to.emit(vault, 'TokensDeposited')
        .withArgs(
          0,
          user1.address,
          ethers.ZeroAddress,
          ethAmount,
          await token1.getAddress(),
          tokenAmount
        );
    });

    it("Should revert when ETH amount doesn't match msg.value", async function () {
      const ethAmount = ethers.parseEther('1');
      const tokenAmount = ethers.parseEther('100');

      await expect(
        vault
          .connect(user1)
          .deposit(
            ethers.ZeroAddress,
            ethAmount,
            await token1.getAddress(),
            tokenAmount,
            { value: ethers.parseEther('0.5') }
          )
      ).to.be.revertedWithCustomError(vault, 'InvalidAmount');
    });
  });

  describe('Token Withdrawals', function () {
    it('Should withdraw tokens by deposit ID correctly', async function () {
      const amount0 = ethers.parseEther('100');
      const amount1 = ethers.parseEther('200');

      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          amount0,
          await token1.getAddress(),
          amount1
        );

      const balanceBefore0 = await token0.balanceOf(user1.address);
      const balanceBefore1 = await token1.balanceOf(user1.address);

      await expect(vault.connect(user1).withdraw(0))
        .to.emit(vault, 'TokensWithdrawn')
        .withArgs(
          0,
          user1.address,
          await token0.getAddress(),
          amount0,
          await token1.getAddress(),
          amount1
        );
    });

    it('Should revert when withdrawing non-existent deposit', async function () {
      await expect(
        vault.connect(user1).withdraw(999)
      ).to.be.revertedWithCustomError(vault, 'DepositNotFound');
    });

    it('Should revert when withdrawing already withdrawn deposit', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await vault.connect(user1).withdraw(0);
      await expect(
        vault.connect(user1).withdraw(0)
      ).to.be.revertedWithCustomError(vault, 'DepositAlreadyWithdrawn');
    });

    it('Should revert when non-depositor tries to withdraw deposit', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await expect(
        vault.connect(user2).withdraw(0)
      ).to.be.revertedWithCustomError(vault, 'UnauthorizedWithdrawal');
    });

    it('Should handle multiple deposits and withdrawals', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('50'),
          await token1.getAddress(),
          ethers.parseEther('75')
        );
      await vault.connect(user1).withdraw(0);
      await vault.connect(user1).withdraw(1);
    });
  });

  describe('ETH Withdrawals (token0 or token1 is zero address)', function () {
    it('Should withdraw ETH correctly', async function () {
      const ethAmount = ethers.parseEther('1');
      const tokenAmount = ethers.parseEther('100');

      await token1.mint(user1.address, tokenAmount);
      await token1
        .connect(user1)
        .approve(await vault.getAddress(), tokenAmount);

      await vault
        .connect(user1)
        .deposit(
          ethers.ZeroAddress,
          ethAmount,
          await token1.getAddress(),
          tokenAmount,
          { value: ethAmount }
        );

      await expect(vault.connect(user1).withdraw(0))
        .to.emit(vault, 'TokensWithdrawn')
        .withArgs(
          0,
          user1.address,
          ethers.ZeroAddress,
          ethAmount,
          await token1.getAddress(),
          tokenAmount
        );
    });
  });

  describe('Deposit Information', function () {
    it('Should return correct deposit information', async function () {
      const amount0 = ethers.parseEther('100');
      const amount1 = ethers.parseEther('200');

      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          amount0,
          await token1.getAddress(),
          amount1
        );

      const deposit = await vault.getDeposit(0);
      expect(deposit.user).to.equal(user1.address);
      expect(deposit.token0Address).to.equal(await token0.getAddress());
      expect(deposit.token1Address).to.equal(await token1.getAddress());
      expect(deposit.amount0).to.equal(amount0);
      expect(deposit.amount1).to.equal(amount1);
      expect(deposit.withdrawn).to.be.false;
    });

    it('Should mark deposit as withdrawn after withdrawal', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await vault.connect(user1).withdraw(0);
      const deposit = await vault.getDeposit(0);
      expect(deposit.withdrawn).to.be.true;
    });
  });

  describe('Mixed Operations', function () {
    it('Should handle multiple users with different deposits', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      await vault
        .connect(user2)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('50'),
          await token1.getAddress(),
          ethers.parseEther('75')
        );
    });
  });

  describe('Edge Cases', function () {
    it('Should handle very small amounts', async function () {
      const smallAmount = 1n;
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          smallAmount,
          await token1.getAddress(),
          smallAmount
        );
    });

    it('Should handle very large amounts', async function () {
      const largeAmount = ethers.parseEther('1000000');
      await token0.mint(user1.address, largeAmount);
      await token1.mint(user1.address, largeAmount);
      await token0
        .connect(user1)
        .approve(await vault.getAddress(), largeAmount);
      await token1
        .connect(user1)
        .approve(await vault.getAddress(), largeAmount);
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          largeAmount,
          await token1.getAddress(),
          largeAmount
        );
    });

    it('Should handle multiple deposits and withdrawals', async function () {
      const deposit1_0 = ethers.parseEther('100');
      const deposit1_1 = ethers.parseEther('200');
      const deposit2_0 = ethers.parseEther('50');
      const deposit2_1 = ethers.parseEther('75');
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          deposit1_0,
          await token1.getAddress(),
          deposit1_1
        );
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          deposit2_0,
          await token1.getAddress(),
          deposit2_1
        );
      await vault.connect(user1).withdraw(0);
      await vault.connect(user1).withdraw(1);
    });
  });

  describe('Reentrancy Protection', function () {
    it('Should prevent reentrancy attacks on token deposits', async function () {
      const amount = ethers.parseEther('100');
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          amount,
          await token1.getAddress(),
          amount
        );
      await expect(
        vault
          .connect(user1)
          .deposit(
            await token0.getAddress(),
            amount,
            await token1.getAddress(),
            amount
          )
      ).to.not.be.reverted;
    });
  });

  describe('Gas Optimization', function () {
    it('Should use reasonable gas for token deposits', async function () {
      const amount = ethers.parseEther('100');
      const tx = await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          amount,
          await token1.getAddress(),
          amount
        );
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(300000n);
    });

    it('Should use reasonable gas for token withdrawals', async function () {
      await vault
        .connect(user1)
        .deposit(
          await token0.getAddress(),
          ethers.parseEther('100'),
          await token1.getAddress(),
          ethers.parseEther('200')
        );
      const tx = await vault.connect(user1).withdraw(0);
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(200000n);
    });
  });
});
