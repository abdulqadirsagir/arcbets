# Contributing to Arc Binary Options

Thank you for your interest in contributing! 🎉

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/arc-binary-options.git
   cd arc-binary-options
   ```
3. **Install dependencies**:
   ```bash
   npm run setup
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Smart Contracts

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npx hardhat node  # Terminal 1
npm run deploy:localhost  # Terminal 2
```

### Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### Backend (Oracle)

```bash
cd backend
npm start
```

## Code Style

- Use 2 spaces for indentation
- Follow existing code patterns
- Write clear commit messages
- Add comments for complex logic

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**: `npm test`
4. **Update README.md** if relevant
5. **Submit PR** with clear description

### PR Title Format

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`

## Testing

Before submitting:
- ✅ All contract tests pass
- ✅ Frontend builds without errors
- ✅ No console errors in browser
- ✅ Code is properly formatted

## Reporting Issues

When reporting bugs, include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)
- Screenshots if applicable

## Feature Requests

We welcome feature suggestions! Please:
- Check existing issues first
- Describe the feature clearly
- Explain the use case
- Consider implementation approach

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the project

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in pull request comments
- Check existing documentation

---

Thank you for contributing! 🚀
