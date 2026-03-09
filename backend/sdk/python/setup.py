from setuptools import setup, find_packages

setup(
    name="anyforge-client",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["httpx"],
    author="Kenz",
    description="Official Python SDK for AnyForge-AI structured data extraction.",
    python_requires=">=3.8",
)
